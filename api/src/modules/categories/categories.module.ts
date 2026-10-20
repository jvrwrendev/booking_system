import type { AppModule } from "../../app.module.js";
import { categoriesRouter } from "./categories.routes.js";

export const categoriesModule: AppModule = {
  name: "categories",
  basePath: "/api/v1/categories",
  router: categoriesRouter,
};
