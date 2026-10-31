import type { AppModule } from "../../app.module.js";
import { branchOrdersRouter } from "./branch-orders.routes.js";

export const branchOrdersModule: AppModule = {
  name: "branch-orders",
  basePath: "/api/v1/branch-orders",
  router: branchOrdersRouter,
};
