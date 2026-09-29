import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { sessionsRouter } from "./sessions.routes.js";
import {
  changePasswordController,
  getMeController,
  loginController,
  logoutController,
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

export const authRouter = Router();

authRouter.post("/login", loginRateLimiter, loginController);

authRouter.post("/logout", logoutController);

authRouter.get("/me", getMeController);

authRouter.post("/change-password", changePasswordController);

authRouter.use("/sessions", sessionsRouter);