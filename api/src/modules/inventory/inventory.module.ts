import type { AppModule } from "../../app.module.js";
import { inventoryRouter } from "./inventory.routes.js";

export const inventoryModule: AppModule = {
  name: "inventory",
  basePath: "/api/v1/inventory",
  router: inventoryRouter,
};
