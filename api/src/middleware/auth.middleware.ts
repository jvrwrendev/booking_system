import type { RequestHandler } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { Errors } from "../lib/app-error.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { PUBLIC_USER_SELECT } from "../lib/user-select.js";
import { AUTH_COOKIE_NAME } from "../constants.js";
import type { AuthenticatedRequest, AuthUser } from "../features/auth/auth.types.js";

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

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: PUBLIC_USER_SELECT,
    });

    if (!user) {
      throw Errors.unauthorized("Account no longer exists");
    }

    if (user.status !== "ACTIVE") {
      throw Errors.unauthorized("Account is inactive or suspended");
    }

    (req as AuthenticatedRequest).user = user as AuthUser;
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