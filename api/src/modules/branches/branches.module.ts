import type { AppModule } from "../../app.module.js";
import { branchesRouter } from "./branches.routes.js";

export const branchesModule: AppModule = {
  name: "branches",
  basePath: "/api/v1/branches",
  router: branchesRouter,
};
