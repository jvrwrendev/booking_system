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
import { bookingsModule } from "./modules/bookings/bookings.module.js";
import { reportsModule } from "./modules/reports/reports.module.js";
import { registerModules } from "./app.module.js";
import { authenticateUnlessPublic } from "./middleware/auth.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  /**
   * Development helpers: Expo web may be opened from another machine on the
   * LAN (e.g. http://192.168.1.43:8081). Rather than hard-coding every host,
   * allow loopback and private IPv4 ranges in development only.
   */
  const isLoopbackOrPrivateOrigin = (origin: string): boolean => {
    try {
      const { hostname } = new URL(origin);
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1"
      ) {
        return true;
      }
      const match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
      if (!match) return false;
      const [a, b] = [Number(match[1]), Number(match[2])];
      return (
        a === 127 ||
        a === 10 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168)
      );
    } catch {
      return false;
    }
  };

  const allowedOrigins = env.corsOrigins;

  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin / non-browser requests have no Origin header.
        if (!origin) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        if (!env.isProduction && isLoopbackOrPrivateOrigin(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
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
    bookingsModule,
    reportsModule,
  ]);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}