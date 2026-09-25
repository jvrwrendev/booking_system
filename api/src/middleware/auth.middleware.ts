import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { Errors } from "../lib/app-error.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { PUBLIC_USER_SELECT, toPublicUser } from "../lib/user-select.js";
import { AUTH_COOKIE_NAME } from "../constants.js";
import type {
  AuthenticatedRequest,
  AuthUser,
  SessionMeta,
} from "../modules/auth/auth.types.js";

export const authenticate: RequestHandler = asyncHandler(
  async (req, _res, next) => {
    const token = req.cookies?.[AUTH_COOKIE_NAME];

    if (typeof token !== "string" || token.length === 0) {
      throw Errors.unauthorized("Not authenticated");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw Errors.unauthorized("Session is invalid or has expired");
    }

    if (typeof payload.sid !== "string" || payload.sid.length === 0) {
      throw Errors.unauthorized("Session is invalid or has expired");
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: { select: PUBLIC_USER_SELECT } },
    });

    if (!session) {
      throw Errors.unauthorized("Session no longer exists");
    }

    if (session.revokedAt) {
      throw Errors.unauthorized("Session has been revoked");
    }

    if (session.expiresAt <= new Date()) {
      await prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => undefined);
      throw Errors.unauthorized("Session has expired");
    }

    const user = toPublicUser(session.user);

    if (user.status !== "ACTIVE") {
      throw Errors.unauthorized("Account is inactive or suspended");
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = user as AuthUser;
    authReq.session = {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    } satisfies SessionMeta;
    next();
  },
);

const PUBLIC_PATHS = [
  "/health",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
] as const;

export function unless(
  paths: readonly string[],
  handler: RequestHandler,
): RequestHandler {
  const publicSet = new Set(paths);
  return (req, res, next) => {
    const normalized = req.path.replace(/\/+$/, "");
    if (publicSet.has(normalized)) {
      next();
      return;
    }
    handler(req, res, next);
  };
}

export const authenticateUnlessPublic = unless(
  PUBLIC_PATHS,
  authenticate,
);