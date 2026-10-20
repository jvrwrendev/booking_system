import type { Request } from "express";
import type { AccountStatus, Role } from "@prisma/client";
import type { PublicUser } from "../../lib/user-select.js";

export type { Role, AccountStatus };

export type AuthUser = PublicUser;

export interface SessionMeta {
  id: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface SessionView {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  expiresAt: Date;
  current: boolean;
}

export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, string | string[] | undefined>,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: AuthUser;
  session: SessionMeta;
}