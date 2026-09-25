import type { Request } from "express";
import type { AccountStatus, Role } from "@prisma/client";
import type { PublicUser } from "../../lib/user-select.js";

export type { Role, AccountStatus };

export type AuthUser = PublicUser;

export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string | string[] | undefined>,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: AuthUser;
}