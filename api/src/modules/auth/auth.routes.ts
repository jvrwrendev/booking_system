import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { sessionsRouter } from "./sessions.routes.js";
import {
  changePasswordController,
  getMeController,
  loginController,
  logoutController,
  registerController,
  resendVerificationEmailController,
  updateProfileController,
  verifyEmailController,
} from "./auth.controller.js";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many login attempts. Try again later.",
    },
  },
});

const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many registration attempts. Try again later.",
    },
  },
});

const verifyEmailRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  keyGenerator: (req) => req.ip ?? "unknown",
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many verification attempts. Try again later.",
    },
  },
});

const resendVerificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  keyGenerator: (req) => `${req.ip}:${(req.body as { email?: string })?.email ?? "unknown"}`,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many resend attempts. Try again later.",
    },
  },
});

export const authRouter = Router();

authRouter.post("/register", registerRateLimiter, registerController);

authRouter.post("/login", loginRateLimiter, loginController);

authRouter.post("/logout", logoutController);

authRouter.get("/me", getMeController);

authRouter.patch("/profile", updateProfileController);

authRouter.post("/change-password", changePasswordController);

// Email verification (public — no session required)
authRouter.post(
  "/verify-email",
  verifyEmailRateLimiter,
  verifyEmailController,
);

authRouter.get(
  "/verify-email",
  verifyEmailRateLimiter,
  verifyEmailController,
);

authRouter.post(
  "/verify-email/resend",
  resendVerificationRateLimiter,
  resendVerificationEmailController,
);

authRouter.use("/sessions", sessionsRouter);
