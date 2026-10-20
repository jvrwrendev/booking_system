import type { AppModule } from "../../app.module.js";
import { productsRouter } from "./products.routes.js";

export const productsModule: AppModule = {
  name: "products",
  basePath: "/api/v1/products",
  router: productsRouter,
};
