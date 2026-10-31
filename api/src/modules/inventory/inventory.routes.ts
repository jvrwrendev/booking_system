import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  adjustmentController,
  commitOrderStockController,
  getAlertsController,
  getSummaryController,
  listBranchesController,
  listInventoryController,
  listTransactionsController,
  releaseOrderStockController,
  stockInController,
  stockOutController,
  transferController,
} from "./inventory.controller.js";
import {
  inventoryAlertsQueryDto,
  inventoryListQueryDto,
  inventorySummaryQueryDto,
  orderReferenceParamsDto,
  orderStockItemsDto,
  stockAdjustmentDto,
  stockInDto,
  stockOutDto,
  stockTransferDto,
  transactionListQueryDto,
} from "./dto/index.js";

export const inventoryRouter = Router();

// Agents need the active branch list when creating a customer booking.
inventoryRouter.get(
  "/branches",
  requireRole("ADMIN", "AGENT", "BRANCH"),
  listBranchesController,
);

inventoryRouter.use(requireRole("ADMIN"));

inventoryRouter.get(
  "/",
  validateQuery(inventoryListQueryDto),
  listInventoryController,
);

inventoryRouter.get(
  "/summary",
  validateQuery(inventorySummaryQueryDto),
  getSummaryController,
);

inventoryRouter.get(
  "/alerts",
  validateQuery(inventoryAlertsQueryDto),
  getAlertsController,
);

inventoryRouter.get(
  "/transactions",
  validateQuery(transactionListQueryDto),
  listTransactionsController,
);

inventoryRouter.post(
  "/stock-in",
  validateBody(stockInDto),
  stockInController,
);

inventoryRouter.post(
  "/stock-out",
  validateBody(stockOutDto),
  stockOutController,
);

inventoryRouter.post(
  "/adjustments",
  validateBody(stockAdjustmentDto),
  adjustmentController,
);

inventoryRouter.post(
  "/transfers",
  validateBody(stockTransferDto),
  transferController,
);

inventoryRouter.post(
  "/orders/:referenceType/:referenceId/commit",
  validateParams(orderReferenceParamsDto),
  validateBody(orderStockItemsDto),
  commitOrderStockController,
);

inventoryRouter.post(
  "/orders/:referenceType/:referenceId/release",
  validateParams(orderReferenceParamsDto),
  validateBody(orderStockItemsDto),
  releaseOrderStockController,
);
