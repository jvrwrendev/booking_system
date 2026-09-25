import type { CookieOptions, Request } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { env } from "../../config/env.js";
import { AUTH_COOKIE_NAME } from "../../constants.js";
import { accessTokenTtlMs } from "../../lib/jwt.js";
import type { AuthenticatedRequest } from "./auth.types.js";
import { changePasswordDto, loginDto } from "./dto/index.js";
import { changePassword, getCurrentUser, login } from "./auth.service.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/",
};

export const loginController = asyncHandler(async (req: Request, res) => {
  const dto = loginDto.parse(req.body);

  const { accessToken, user } = await login(dto);

  res.cookie(AUTH_COOKIE_NAME, accessToken, {
    ...cookieOptions,
    maxAge: accessTokenTtlMs(),
  });

  return sendSuccess(res, { user });
});

export const logoutController = asyncHandler(async (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
  return sendSuccess(res, { message: "Logged out successfully" });
});

export const getMeController = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const user = await getCurrentUser(req.user.id);
    return sendSuccess(res, { user });
  },
);

export const changePasswordController = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const dto = changePasswordDto.parse(req.body);
    await changePassword(req.user.id, dto);
    return sendSuccess(res, { message: "Password changed successfully" });
  },
);