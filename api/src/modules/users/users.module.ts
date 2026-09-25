import type { AppModule } from "../../app.module.js";
import { usersRouter } from "./users.routes.js";

export const usersModule: AppModule = {
  name: "users",
  basePath: "/api/v1/users",
  router: usersRouter,
};