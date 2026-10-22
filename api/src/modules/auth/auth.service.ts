import { createHash, randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "../../lib/argon2.js";
import { AppError, Errors } from "../../lib/app-error.js";
import { signAccessToken, sessionTtlMs } from "../../lib/jwt.js";
import { sendVerificationEmail } from "../../lib/email.js";
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

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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

export async function register(
  input: RegisterDto,
  _meta: LoginMeta,
): Promise<RegisterResult> {
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

  // Generate a secure, single-use, time-limited verification token.
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + verificationTtlMs());

  await prisma.emailVerificationToken.create({
    data: {
      userId: account.id,
      tokenHash,
      expiresAt,
    },
  });

  // Send the verification email via Resend (backend only). Registration still
  // succeeds even if email delivery fails; the user can request a resend.
  const verifyUrl = `${env.PUBLIC_BASE_URL}/api/v1/auth/verify-email?token=${token}`;
  void sendVerificationEmail({
    to: account.email,
    userName: account.name,
    token,
    verifyUrl,
  }).catch((error) => {
    console.error("Failed to send verification email:", error);
  });

  return { user: toPublicUser(account) };
}

export async function verifyEmail(
  token: string,
): Promise<{ user: AuthUser }> {
  const tokenHash = hashToken(token);

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: { select: PUBLIC_USER_SELECT } },
  });

  if (!verificationToken) {
    throw new AppError(400, "Invalid verification token.", {
      code: "INVALID_TOKEN",
    });
  }

  if (verificationToken.usedAt) {
    throw new AppError(400, "This verification token has already been used.", {
      code: "TOKEN_ALREADY_USED",
    });
  }

  if (verificationToken.expiresAt <= new Date()) {
    throw new AppError(400, "This verification token has expired.", {
      code: "EXPIRED_TOKEN",
    });
  }

  const user = toPublicUser(verificationToken.user);

  if (user.emailVerified) {
    throw new AppError(400, "This email address is already verified.", {
      code: "ALREADY_VERIFIED",
    });
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: now },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, id: { not: verificationToken.id } },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: now },
    }),
  ]);

  return { user: { ...user, emailVerified: now } };
}

export async function resendVerificationEmail(
  email: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, emailVerified: true },
  });

  // Always return successfully to avoid leaking whether an email is registered.
  if (!user || user.emailVerified) {
    return;
  }

  // Rotate tokens: remove any existing unused tokens for this user.
  await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + verificationTtlMs());

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const verifyUrl = `${env.PUBLIC_BASE_URL}/api/v1/auth/verify-email?token=${token}`;
  void sendVerificationEmail({
    to: user.email,
    userName: user.name,
    token,
    verifyUrl,
  }).catch((error) => {
    console.error("Failed to send verification email:", error);
  });
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