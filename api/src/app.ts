import type { Express } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { sendSuccess } from "./lib/api-response.js";
import { authModule } from "./modules/auth/auth.module.js";
import { usersModule } from "./modules/users/users.module.js";
import { registerModules } from "./app.module.js";
import { authenticateUnlessPublic } from "./middleware/auth.middleware.js";
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

  registerModules(app, [authModule, usersModule]);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}