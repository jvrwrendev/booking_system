import type { AppModule } from "../../app.module.js";
import { reportsRouter } from "./reports.routes.js";

export const reportsModule: AppModule = {
  name: "reports",
  basePath: "/api/v1/reports",
  router: reportsRouter,
};
