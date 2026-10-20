import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  createProductController,
  deleteProductController,
  getProductController,
  listProductsController,
  updateProductController,
} from "./products.controller.js";
import {
  createProductDto,
  listProductsQueryDto,
  productParamsDto,
  updateProductDto,
} from "./dto/index.js";

export const productsRouter = Router();

productsRouter.use(requireRole("ADMIN"));

productsRouter.get(
  "/",
  validateQuery(listProductsQueryDto),
  listProductsController,
);

productsRouter.get(
  "/:id",
  validateParams(productParamsDto),
  getProductController,
);

productsRouter.post("/", validateBody(createProductDto), createProductController);

productsRouter.patch(
  "/:id",
  validateParams(productParamsDto),
  validateBody(updateProductDto),
  updateProductController,
);

productsRouter.delete(
  "/:id",
  validateParams(productParamsDto),
  deleteProductController,
);
