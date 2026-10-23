import { randomBytes, randomInt } from "node:crypto";
import { hashPassword, verifyPassword } from "../../lib/argon2.js";
import { AppError, Errors } from "../../lib/app-error.js";
import { signAccessToken, sessionTtlMs } from "../../lib/jwt.js";
import { sendVerificationCodeEmail } from "../../lib/email.js";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
} from "../../lib/user-select.js";
import type { AuthUser, SessionView } from "./auth.types.js";
import type {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
} from "./dto/index.js";

export interface LoginMeta {
  ip?: string;
  userAgent?: string;
}

export type LoginResult = {
  accessToken: string;
  user: AuthUser;
  session: SessionView;
};

export type RegisterResult = {
  user: AuthUser;
};

function verificationTtlMs(): number {
  const unit = env.EMAIL_VERIFICATION_TTL.slice(-1);
  const value = Number.parseInt(env.EMAIL_VERIFICATION_TTL.slice(0, -1), 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  const multiplier = multipliers[unit];
  if (!multiplier) {
    throw new Error("Invalid EMAIL_VERIFICATION_TTL");
  }
  return value * multiplier;
}

const VERIFICATION_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Generates a cryptographically random six-digit code, stores only its argon2
 * hash, and resets the attempt counter. The plaintext is returned solely so it
 * can be delivered by email.
 */
async function createVerificationChallenge(userId: string): Promise<string> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codeHash = await hashPassword(code);
  const now = new Date();

  await prisma.emailVerificationCode.create({
    data: {
      userId,
      codeHash,
      expiresAt: new Date(now.getTime() + verificationTtlMs()),
      attempts: 0,
      lastSentAt: now,
    },
  });

  return code;
}

function toSessionView(
  session: {
    id: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
  },
  currentSessionId: string,
): SessionView {
  return {
    id: session.id,
    ip: session.ip,
    userAgent: session.userAgent,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    current: session.id === currentSessionId,
  };
}

function generatePublicId(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function login(
  input: LoginDto,
  meta: LoginMeta,
): Promise<LoginResult> {
  const account = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!account) {
    throw Errors.unauthorized("Invalid email or password");
  }

  const passwordMatches = await verifyPassword(
    account.passwordHash,
    input.password,
  );

  if (!passwordMatches) {
    throw Errors.unauthorized("Invalid email or password");
  }

  if (account.status !== "ACTIVE") {
    throw Errors.unauthorized(
      "This account is inactive or suspended. Contact your administrator.",
    );
  }

  if (!account.emailVerified) {
    throw new AppError(403, "Please verify your email address before signing in.", {
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const expiresAt = new Date(Date.now() + sessionTtlMs());

  const session = await prisma.session.create({
    data: {
      userId: account.id,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt,
    },
  });

  const accessToken = signAccessToken({
    id: account.id,
    role: account.role,
    sessionId: session.id,
  });

  const { passwordHash: _passwordHash, ...user } = account;

  return {
    accessToken,
    user,
    session: toSessionView(session, session.id),
  };
}

export async function register(input: RegisterDto): Promise<RegisterResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw Errors.conflict("An account with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const agentId = input.role === "AGENT" ? generatePublicId("AGT") : null;
  const branchId = input.role === "BRANCH" ? generatePublicId("BR") : null;

  const account = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      contactNumber: input.contactNumber,
      address: input.address,
      avatar: input.avatar,
      agentId,
      branchId,
      emailVerified: null,
    },
    select: PUBLIC_USER_SELECT,
  });

  // Issue a single-use, time-limited six-digit code. Only its argon2 hash is
  // stored; the plaintext exists solely in the email.
  const code = await createVerificationChallenge(account.id);

  // Send the verification email through Gmail SMTP (backend only).
  // Registration still succeeds even if email delivery fails; the user can
  // request a resend.
  void sendVerificationCodeEmail({
    to: account.email,
    userName: account.name,
    code,
    expiresInMinutes: Math.round(verificationTtlMs() / 60_000),
  }).catch((error) => {
    console.error("Failed to send verification email:", error);
  });

  return { user: toPublicUser(account) };
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<{ user: AuthUser }> {
  const account = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (!account) {
    // Keep the failure unbiased: an unknown email reports the same error as a
    // wrong code, so the endpoint cannot be used to enumerate accounts.
    throw new AppError(400, "That verification code is incorrect.", {
      code: "INVALID_CODE",
    });
  }

  if (account.emailVerified) {
    throw new AppError(400, "This email address is already verified.", {
      code: "ALREADY_VERIFIED",
    });
  }

  const challenge = await prisma.emailVerificationCode.findFirst({
    where: { userId: account.id },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge || challenge.expiresAt <= new Date()) {
    if (challenge) {
      await prisma.emailVerificationCode.deleteMany({
        where: { userId: account.id },
      });
    }
    throw new AppError(
      400,
      "This verification code has expired. Request a new one.",
      { code: "EXPIRED_CODE" },
    );
  }

  if (challenge.attempts >= VERIFICATION_MAX_ATTEMPTS) {
    await prisma.emailVerificationCode.deleteMany({
      where: { userId: account.id },
    });
    throw new AppError(
      400,
      "Too many incorrect attempts. Request a new verification code.",
      { code: "TOO_MANY_ATTEMPTS" },
    );
  }

  const matches = await verifyPassword(challenge.codeHash, code);

  if (!matches) {
    const attempts = challenge.attempts + 1;

    if (attempts >= VERIFICATION_MAX_ATTEMPTS) {
      await prisma.emailVerificationCode.deleteMany({
        where: { userId: account.id },
      });
      throw new AppError(
        400,
        "Too many incorrect attempts. Request a new verification code.",
        { code: "TOO_MANY_ATTEMPTS" },
      );
    }

    await prisma.emailVerificationCode.update({
      where: { id: challenge.id },
      data: { attempts },
    });

    const remaining = VERIFICATION_MAX_ATTEMPTS - attempts;
    throw new AppError(
      400,
      `That verification code is incorrect. ${remaining} ${
        remaining === 1 ? "attempt" : "attempts"
      } remaining.`,
      { code: "INVALID_CODE" },
    );
  }

  const now = new Date();

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id: account.id },
      data: { emailVerified: now },
      select: PUBLIC_USER_SELECT,
    }),
    prisma.emailVerificationCode.deleteMany({
      where: { userId: account.id },
    }),
  ]);

  return { user: toPublicUser(updated) };
}

export async function resendVerificationEmail(
  email: string,
): Promise<{ sent: boolean; retryAfterSeconds: number; expiresInSeconds: number }> {
  const ttlSeconds = Math.round(verificationTtlMs() / 1000);
  const notSent = {
    sent: false,
    retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
    expiresInSeconds: ttlSeconds,
  };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  // Always return successfully to avoid leaking whether an email is registered.
  if (!user || user.emailVerified) {
    return notSent;
  }

  const existing = await prisma.emailVerificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, lastSentAt: true, expiresAt: true },
  });

  if (existing) {
    const elapsedMs = Date.now() - existing.lastSentAt.getTime();
    const cooldownMs = RESEND_COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      return {
        sent: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((cooldownMs - elapsedMs) / 1000),
        ),
        expiresInSeconds: Math.max(
          1,
          Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000),
        ),
      };
    }
  }

  // Rotate: a resend always invalidates the previous code.
  await prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });
  const code = await createVerificationChallenge(user.id);

  const delivery = await sendVerificationCodeEmail({
    to: user.email,
    userName: user.name,
    code,
    expiresInMinutes: Math.round(verificationTtlMs() / 60_000),
  });

  if (!delivery.success) {
    await prisma.emailVerificationCode.deleteMany({ where: { userId: user.id } });
    throw new AppError(
      503,
      "We could not send the verification code right now. Please try again shortly.",
      { code: "EMAIL_DELIVERY_FAILED" },
    );
  }

  return {
    sent: true,
    retryAfterSeconds: RESEND_COOLDOWN_SECONDS,
    expiresInSeconds: ttlSeconds,
  };
}



export async function updateProfile(
  userId: string,
  input: UpdateProfileDto,
): Promise<AuthUser> {
  if (input.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existing && existing.id !== userId) {
      throw Errors.conflict("An account with this email already exists");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.contactNumber !== undefined && {
        contactNumber: input.contactNumber,
      }),
      ...(input.address !== undefined && { address: input.address }),
      ...(input.avatar !== undefined && { avatar: input.avatar }),
    },
    select: PUBLIC_USER_SELECT,
  });

  return toPublicUser(user);
}

export async function getCurrentUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });

  if (!user) {
    throw Errors.unauthorized("Account no longer exists");
  }

  return toPublicUser(user);
}

export async function getActiveSessions(
  userId: string,
  currentSessionId: string,
): Promise<SessionView[]> {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((session) => toSessionView(session, currentSessionId));
}

export async function revokeSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  const { count } = await prisma.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  if (count === 0) {
    throw Errors.notFound("Session not found");
  }
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeSessionById(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(
  userId: string,
  currentSessionId: string,
  input: ChangePasswordDto,
): Promise<void> {
  const account = await prisma.user.findUnique({ where: { id: userId } });

  if (!account) {
    throw Errors.unauthorized("Account no longer exists");
  }

  const currentPasswordMatches = await verifyPassword(
    account.passwordHash,
    input.currentPassword,
  );

  if (!currentPasswordMatches) {
    throw Errors.badRequest("Current password is incorrect", {
      code: "INVALID_CURRENT_PASSWORD",
    });
  }

  const newHash = await hashPassword(input.newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    }),
    prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
        id: { not: currentSessionId },
      },
      data: { revokedAt: new Date() },
    }),
  ]);
}