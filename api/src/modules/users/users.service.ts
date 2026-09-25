import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";
import { hashPassword } from "../../lib/argon2.js";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { PUBLIC_USER_SELECT } from "../../lib/user-select.js";
import type {
  CreateUserDto,
  ListUsersQueryDto,
  SetPasswordDto,
  UpdateUserDto,
  UpdateUserStatusDto,
} from "./dto/index.js";
import type { ListUsersResult, UserView } from "./users.types.js";

export interface UserActor {
  id: string;
  role: Role;
}

const isSuperAdmin = (actor: UserActor): boolean =>
  actor.role === "SUPER_ADMIN";

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function assertCanManage(actor: UserActor, target: UserView): void {
  if (target.role === "SUPER_ADMIN" && !isSuperAdmin(actor)) {
    throw Errors.forbidden(
      "Only super admins can manage super admin accounts",
    );
  }
}

function assertNotSelf(actorId: string, targetId: string): void {
  if (actorId === targetId) {
    throw Errors.forbidden("You cannot perform this action on your own account");
  }
}

async function mustGetUser(id: string): Promise<UserView> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: PUBLIC_USER_SELECT,
  });

  if (!user) {
    throw Errors.notFound("User not found");
  }

  return user;
}

export async function listUsers(query: ListUsersQueryDto): Promise<ListUsersResult> {
  const where: Prisma.UserWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.role) where.role = query.role;
  if (query.status) where.status = query.status;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: PUBLIC_USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getUserById(id: string): Promise<UserView> {
  return mustGetUser(id);
}

export async function createUser(
  actor: UserActor,
  input: CreateUserDto,
): Promise<UserView> {
  if (input.role === "SUPER_ADMIN" && !isSuperAdmin(actor)) {
    throw Errors.forbidden(
      "Only super admins can create super admin accounts",
    );
  }

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        status: input.status,
      },
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw Errors.conflict("That email is already in use");
    }
    throw error;
  }
}

export async function updateUser(
  actor: UserActor,
  id: string,
  input: UpdateUserDto,
): Promise<UserView> {
  const target = await mustGetUser(id);
  assertCanManage(actor, target);

  if (
    actor.id === id &&
    (input.role !== undefined || input.status !== undefined)
  ) {
    throw Errors.forbidden("You cannot change your own role or status");
  }

  if (input.role === "SUPER_ADMIN" && !isSuperAdmin(actor)) {
    throw Errors.forbidden(
      "Only super admins can assign the super admin role",
    );
  }

  try {
    return await prisma.user.update({
      where: { id },
      data: input,
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw Errors.conflict("That email is already in use");
    }
    throw error;
  }
}

export async function updateUserStatus(
  actor: UserActor,
  id: string,
  input: UpdateUserStatusDto,
): Promise<UserView> {
  const target = await mustGetUser(id);
  assertCanManage(actor, target);
  assertNotSelf(actor.id, id);

  return prisma.user.update({
    where: { id },
    data: { status: input.status },
    select: PUBLIC_USER_SELECT,
  });
}

export async function setUserPassword(
  actor: UserActor,
  id: string,
  input: SetPasswordDto,
): Promise<void> {
  const target = await mustGetUser(id);
  assertCanManage(actor, target);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(input.password) },
  });
}

export async function deleteUser(actor: UserActor, id: string): Promise<void> {
  const target = await mustGetUser(id);
  assertCanManage(actor, target);
  assertNotSelf(actor.id, id);

  if (target.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      throw Errors.conflict("Cannot delete the last super admin account");
    }
  }

  await prisma.user.delete({ where: { id } });
}