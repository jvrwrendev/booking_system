import { hashPassword, verifyPassword } from "../../lib/argon2.js";
import { Errors } from "../../lib/app-error.js";
import { signAccessToken } from "../../lib/jwt.js";
import { prisma } from "../../lib/prisma.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
} from "../../lib/user-select.js";
import type { AuthUser } from "./auth.types.js";
import type { ChangePasswordInput, LoginInput } from "./auth.schema.js";

export async function login( input: LoginInput ): Promise<{ accessToken: string; user: AuthUser }> {
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

  const accessToken = signAccessToken({
    id: account.id,
    role: account.role,
  });

  const { passwordHash: _passwordHash, ...user } = account;
  return { accessToken, user };
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

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
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

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}