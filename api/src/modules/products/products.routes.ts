import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  bulkDeleteProductsController,
  createProductController,
  deleteProductController,
  getProductController,
  listProductsController,
  updateProductController,
} from "./products.controller.js";
import {
  bulkDeleteProductsDto,
  createProductDto,
  listProductsQueryDto,
  productParamsDto,
  updateProductDto,
} from "./dto/index.js";

export const productsRouter = Router();

// Catalog browsing is shared with agents and branches; writes stay admin-only.
const canReadCatalog = requireRole("ADMIN", "AGENT", "BRANCH");
const canManageCatalog = requireRole("ADMIN");

productsRouter.get(
  "/",
  canReadCatalog,
  validateQuery(listProductsQueryDto),
  listProductsController,
);

productsRouter.get(
  "/:id",
  canReadCatalog,
  validateParams(productParamsDto),
  getProductController,
);

productsRouter.post(
  "/",
  canManageCatalog,
  validateBody(createProductDto),
  createProductController,
);

productsRouter.post(
  "/bulk-delete",
  canManageCatalog,
  validateBody(bulkDeleteProductsDto),
  bulkDeleteProductsController,
);

productsRouter.patch(
  "/:id",
  canManageCatalog,
  validateParams(productParamsDto),
  validateBody(updateProductDto),
  updateProductController,
);

productsRouter.delete(
  "/:id",
  canManageCatalog,
  validateParams(productParamsDto),
  deleteProductController,
);
