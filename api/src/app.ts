import type { Express } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { sendSuccess } from "./lib/api-response.js";
import { authRouter } from "./features/auth/auth.routes.js";
import { usersRouter } from "./features/users/users.routes.js";
import { authenticateUnlessPublic } from "./middleware/auth.middleware.js";
import { requireRole } from "./middleware/role.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use(authenticateUnlessPublic);

  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok" });
  });

  app.use("/api/v1/auth", authRouter);

  app.use("/api/v1/users", usersRouter);

  app.get("/api/v1/admin/example", requireRole("SUPER_ADMIN"), (_req, res) => {
    sendSuccess(res, { message: "Super admin only area" });
  });

  app.get(
    "/api/v1/admin/example-admin",
    requireRole("ADMIN"),
    (_req, res) => {
      sendSuccess(res, {
        message: "Admin area (super admins included via hierarchy)",
      });
    },
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}