import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  createSupplierController,
  deleteSupplierController,
  getSupplierController,
  listSuppliersController,
  updateSupplierController,
} from "./suppliers.controller.js";
import {
  createSupplierDto,
  listSuppliersQueryDto,
  supplierParamsDto,
  updateSupplierDto,
} from "./dto/index.js";

export const suppliersRouter = Router();

suppliersRouter.use(requireRole("ADMIN"));

suppliersRouter.get(
  "/",
  validateQuery(listSuppliersQueryDto),
  listSuppliersController,
);

suppliersRouter.get(
  "/:id",
  validateParams(supplierParamsDto),
  getSupplierController,
);

suppliersRouter.post(
  "/",
  validateBody(createSupplierDto),
  createSupplierController,
);

suppliersRouter.patch(
  "/:id",
  validateParams(supplierParamsDto),
  validateBody(updateSupplierDto),
  updateSupplierController,
);

suppliersRouter.delete(
  "/:id",
  validateParams(supplierParamsDto),
  deleteSupplierController,
);
