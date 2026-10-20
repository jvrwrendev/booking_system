import type { Express } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./config/env.js";
import { sendSuccess } from "./lib/api-response.js";
import { authModule } from "./modules/auth/auth.module.js";
import { usersModule } from "./modules/users/users.module.js";
import { categoriesModule } from "./modules/categories/categories.module.js";
import { productsModule } from "./modules/products/products.module.js";
import { suppliersModule } from "./modules/suppliers/suppliers.module.js";
import { inventoryModule } from "./modules/inventory/inventory.module.js";
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

  // Product images are submitted as base64 data URLs by the existing admin
  // image picker, so the catalog endpoints need room for a 5 MB image.
  app.use(express.json({ limit: "8mb" }));
  app.use(cookieParser());

  app.use(authenticateUnlessPublic);

  app.get("/health", (_req, res) => {
    sendSuccess(res, { status: "ok" });
  });

  registerModules(app, [
    authModule,
    usersModule,
    categoriesModule,
    productsModule,
    suppliersModule,
    inventoryModule,
  ]);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}