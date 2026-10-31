import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  applyBranchOrderDiscountController,
  assignBranchOrderController,
  createBranchOrderController,
  deleteBranchOrderController,
  getBranchOrderController,
  listBranchOrdersController,
  unassignBranchOrderController,
  updateBranchOrderController,
  updateBranchOrderStatusController,
} from "./branch-orders.controller.js";
import {
  applyBranchOrderDiscountDto,
  assignBranchOrderDto,
  branchOrderParamsDto,
  createBranchOrderDto,
  listBranchOrdersQueryDto,
  updateBranchOrderDto,
  updateBranchOrderStatusDto,
} from "./dto/index.js";

export const branchOrdersRouter = Router();

// Admins manage every branch order; branch accounts can list, view, and
// create orders for their own branch only (enforced by the service).
branchOrdersRouter.use(requireRole("ADMIN", "BRANCH"));

branchOrdersRouter.get(
  "/",
  validateQuery(listBranchOrdersQueryDto),
  listBranchOrdersController,
);

branchOrdersRouter.get(
  "/:id",
  validateParams(branchOrderParamsDto),
  getBranchOrderController,
);

branchOrdersRouter.post(
  "/",
  validateBody(createBranchOrderDto),
  createBranchOrderController,
);

branchOrdersRouter.patch(
  "/:id",
  requireRole("ADMIN"),
  validateParams(branchOrderParamsDto),
  validateBody(updateBranchOrderDto),
  updateBranchOrderController,
);

branchOrdersRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  validateParams(branchOrderParamsDto),
  deleteBranchOrderController,
);

branchOrdersRouter.patch(
  "/:id/status",
  requireRole("ADMIN"),
  validateParams(branchOrderParamsDto),
  validateBody(updateBranchOrderStatusDto),
  updateBranchOrderStatusController,
);

branchOrdersRouter.patch(
  "/:id/assign",
  requireRole("SUPER_ADMIN"),
  validateParams(branchOrderParamsDto),
  validateBody(assignBranchOrderDto),
  assignBranchOrderController,
);

branchOrdersRouter.delete(
  "/:id/assignment",
  requireRole("SUPER_ADMIN"),
  validateParams(branchOrderParamsDto),
  unassignBranchOrderController,
);

branchOrdersRouter.patch(
  "/:id/discount",
  requireRole("ADMIN"),
  validateParams(branchOrderParamsDto),
  validateBody(applyBranchOrderDiscountDto),
  applyBranchOrderDiscountController,
);
