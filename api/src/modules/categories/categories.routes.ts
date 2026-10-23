import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  createCategoryController,
  deleteCategoryController,
  getCategoryController,
  listCategoriesController,
  updateCategoryController,
} from "./categories.controller.js";
import {
  categoryParamsDto,
  createCategoryDto,
  listCategoriesQueryDto,
  updateCategoryDto,
} from "./dto/index.js";

export const categoriesRouter = Router();

// Catalog browsing is shared with agents and branches; writes stay admin-only.
const canReadCatalog = requireRole("ADMIN", "AGENT", "BRANCH");
const canManageCatalog = requireRole("ADMIN");

categoriesRouter.get(
  "/",
  canReadCatalog,
  validateQuery(listCategoriesQueryDto),
  listCategoriesController,
);

categoriesRouter.get(
  "/:id",
  canReadCatalog,
  validateParams(categoryParamsDto),
  getCategoryController,
);

categoriesRouter.post(
  "/",
  canManageCatalog,
  validateBody(createCategoryDto),
  createCategoryController,
);

categoriesRouter.patch(
  "/:id",
  canManageCatalog,
  validateParams(categoryParamsDto),
  validateBody(updateCategoryDto),
  updateCategoryController,
);

categoriesRouter.delete(
  "/:id",
  canManageCatalog,
  validateParams(categoryParamsDto),
  deleteCategoryController,
);
