import type { AppModule } from "../../app.module.js";
import { authRouter } from "./auth.routes.js";

export const authModule: AppModule = {
  name: "auth",
  basePath: "/api/v1/auth",
  router: authRouter,
};