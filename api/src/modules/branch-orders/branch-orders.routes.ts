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

// Admins manage every branch order. Branch accounts can create and view their
// own orders, but only system administrators can change order status.
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
  requireRole("ADMIN", "BRANCH"),
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
  requireRole("ADMIN"),
  validateParams(branchOrderParamsDto),
  validateBody(assignBranchOrderDto),
  assignBranchOrderController,
);

branchOrdersRouter.delete(
  "/:id/assignment",
  requireRole("ADMIN"),
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
