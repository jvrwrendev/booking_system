import type { CookieOptions, Request } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import { env } from "../../config/env.js";
import { AUTH_COOKIE_NAME } from "../../constants.js";
import { sessionTtlMs, verifyAccessToken } from "../../lib/jwt.js";
import type { AuthenticatedRequest } from "./auth.types.js";
import {
  changePasswordDto,
  loginDto,
  registerDto,
  resendVerificationDto,
  sessionParamsDto,
  updateProfileDto,
  verifyEmailDto,
} from "./dto/index.js";
import {
  changePassword,
  getActiveSessions,
  getCurrentUser,
  login,
  register,
  resendVerificationEmail,
  revokeAllSessions,
  revokeSession,
  revokeSessionById,
  updateProfile,
  verifyEmail,
} from "./auth.service.js";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.isProduction,
  path: "/",
};

export const loginController = asyncHandler(async (req: Request, res) => {
  const dto = loginDto.parse(req.body);

  const { accessToken, user, session } = await login(dto, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  res.cookie(AUTH_COOKIE_NAME, accessToken, {
    ...cookieOptions,
    maxAge: sessionTtlMs(),
  });

  return sendSuccess(res, { user, session });
});

export const registerController = asyncHandler(async (req: Request, res) => {
  const dto = registerDto.parse(req.body);

  const { user } = await register(dto);

  // Registration does not sign the user in: they must verify their email
  // first, then authenticate through the login endpoint.
  return sendSuccess(res, { user }, 201);
});

export const verifyEmailController = asyncHandler(async (req: Request, res) => {
  const dto = verifyEmailDto.parse(req.body);

  const { user } = await verifyEmail(dto.email, dto.code);

  return sendSuccess(res, { user });
});

export const resendVerificationEmailController = asyncHandler(
  async (req: Request, res) => {
    const dto = resendVerificationDto.parse(req.body);

    const result = await resendVerificationEmail(dto.email);

    return sendSuccess(res, result);
  },
);

export const updateProfileController = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const dto = updateProfileDto.parse(req.body);
    const user = await updateProfile(req.user.id, dto);
    return sendSuccess(res, { user });
  },
);

export const logoutController = asyncHandler(async (req, res) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof token === "string" && token.length > 0) {
    try {
      const payload = verifyAccessToken(token);
      if (typeof payload.sid === "string") {
        await revokeSessionById(payload.sid);
      }
    } catch {
      // Best-effort: invalid tokens are simply ignored on logout.
    }
  }

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
    await changePassword(req.user.id, req.session.id, dto);
    return sendSuccess(res, { message: "Password changed successfully" });
  },
);

export const listSessionsController = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    const sessions = await getActiveSessions(req.user.id, req.session.id);
    return sendSuccess(res, { sessions });
  },
);

export const revokeSessionController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const { id } = sessionParamsDto.parse(req.params);

    await revokeSession(req.user.id, id);

    if (id === req.session.id) {
      res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
    }

    return sendSuccess(res, { message: "Session revoked successfully" });
  },
);

export const revokeAllSessionsController = asyncHandler(
  async (req: AuthenticatedRequest, res) => {
    await revokeAllSessions(req.user.id);
    res.clearCookie(AUTH_COOKIE_NAME, cookieOptions);
    return sendSuccess(res, { message: "Logged out everywhere" });
  },
);