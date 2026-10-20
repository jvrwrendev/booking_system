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

categoriesRouter.use(requireRole("ADMIN"));

categoriesRouter.get(
  "/",
  validateQuery(listCategoriesQueryDto),
  listCategoriesController,
);

categoriesRouter.get(
  "/:id",
  validateParams(categoryParamsDto),
  getCategoryController,
);

categoriesRouter.post(
  "/",
  validateBody(createCategoryDto),
  createCategoryController,
);

categoriesRouter.patch(
  "/:id",
  validateParams(categoryParamsDto),
  validateBody(updateCategoryDto),
  updateCategoryController,
);

categoriesRouter.delete(
  "/:id",
  validateParams(categoryParamsDto),
  deleteCategoryController,
);
