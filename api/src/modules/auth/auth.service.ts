import { hashPassword, verifyPassword } from "../../lib/argon2.js";
import { Errors } from "../../lib/app-error.js";
import { signAccessToken, sessionTtlMs } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
} from "../../lib/user-select.js";
import type { AuthUser, SessionView } from "./auth.types.js";
import type { ChangePasswordDto, LoginDto } from "./dto/index.js";

export interface LoginMeta {
  ip?: string;
  userAgent?: string;
}

export type LoginResult = {
  accessToken: string;
  user: AuthUser;
  session: SessionView;
};

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