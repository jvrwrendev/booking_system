import type { Prisma } from "@prisma/client";
import type { AccountStatus, Role } from "@prisma/client";

export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof PUBLIC_USER_SELECT;
}>;

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicUser(user: PublicUserRecord): PublicUser {
  return user;
}