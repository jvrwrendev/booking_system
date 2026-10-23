import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { Errors } from "../lib/app-error.js";
import type { AuthenticatedRequest } from "../modules/auth/auth.types.js";

export const ROLE_GRANTS: Record<Role, readonly Role[]> = {
  SUPER_ADMIN: ["SUPER_ADMIN", "ADMIN"],
  ADMIN: ["ADMIN"],
  AGENT: ["AGENT"],
  BRANCH: ["BRANCH"],
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      next(Errors.unauthorized("Not authenticated"));
      return;
    }

    const userRole = authReq.user.role;
    const hasAccess = roles.some((role) => ROLE_GRANTS[userRole].includes(role));

    if (!hasAccess) {
      next(
        Errors.forbidden("You do not have permission to access this resource"),
      );
      return;
    }

    next();
  };
}