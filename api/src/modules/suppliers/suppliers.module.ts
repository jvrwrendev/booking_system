import type { AppModule } from "../../app.module.js";
import { suppliersRouter } from "./suppliers.routes.js";

export const suppliersModule: AppModule = {
  name: "suppliers",
  basePath: "/api/v1/suppliers",
  router: suppliersRouter,
};
