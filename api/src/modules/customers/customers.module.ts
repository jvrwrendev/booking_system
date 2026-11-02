import type { AppModule } from "../../app.module.js";
import { customersRouter } from "./customers.routes.js";

export const customersModule: AppModule = {
  name: "customers",
  basePath: "/api/v1/customers",
  router: customersRouter,
};
