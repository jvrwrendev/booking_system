import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as inventoryService from "./inventory.service.js";
import type {
  InventoryAlertsQueryDto,
  InventoryListQueryDto,
  InventorySummaryQueryDto,
  OrderReferenceParamsDto,
  OrderStockItemsDto,
  StockAdjustmentDto,
  StockInDto,
  StockOutDto,
  StockTransferDto,
  TransactionListQueryDto,
} from "./dto/index.js";

function actor(req: AuthenticatedRequest) {
  return { id: req.user.id, name: req.user.name };
}

type InventoryRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listInventoryController = asyncHandler(
  async (req: InventoryRequest, res) => {
    const query = req.query as unknown as InventoryListQueryDto;
    const result = await inventoryService.listInventory(query);
    return sendSuccess(res, result);
  },
);

export const getSummaryController = asyncHandler(
  async (req: InventoryRequest, res) => {
    const query = req.query as unknown as InventorySummaryQueryDto;
    const summary = await inventoryService.getInventorySummary(query);
    return sendSuccess(res, { summary });
  },
);

export const getAlertsController = asyncHandler(
  async (req: InventoryRequest, res) => {
    const query = req.query as unknown as InventoryAlertsQueryDto;
    const alerts = await inventoryService.listAlerts(query);
    return sendSuccess(res, { alerts });
  },
);

export const listBranchesController = asyncHandler(async (_req, res) => {
  const branches = await inventoryService.listBranches();
  return sendSuccess(res, { branches });
});

export const listTransactionsController = asyncHandler(
  async (req: InventoryRequest, res) => {
    const query = req.query as unknown as TransactionListQueryDto;
    const result = await inventoryService.listTransactions(query);
    return sendSuccess(res, result);
  },
);

export const stockInController = asyncHandler(
  async (req: InventoryRequest<StockInDto>, res) => {
    const result = await inventoryService.stockIn(req.body, actor(req));
    return sendSuccess(res, result, 201);
  },
);

export const stockOutController = asyncHandler(
  async (req: InventoryRequest<StockOutDto>, res) => {
    const result = await inventoryService.stockOut(req.body, actor(req));
    return sendSuccess(res, result, 201);
  },
);

export const adjustmentController = asyncHandler(
  async (req: InventoryRequest<StockAdjustmentDto>, res) => {
    const result = await inventoryService.adjustStock(req.body, actor(req));
    return sendSuccess(res, result, 201);
  },
);

export const transferController = asyncHandler(
  async (req: InventoryRequest<StockTransferDto>, res) => {
    const result = await inventoryService.transferStock(req.body, actor(req));
    return sendSuccess(res, result, 201);
  },
);

export const commitOrderStockController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ referenceType: string; referenceId: string }, unknown, OrderStockItemsDto>,
    res,
  ) => {
    const params = req.params as unknown as OrderReferenceParamsDto;
    const result = await inventoryService.commitOrderStock(
      params.referenceType,
      params.referenceId,
      req.body,
      actor(req),
    );
    return sendSuccess(res, result);
  },
);

export const releaseOrderStockController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ referenceType: string; referenceId: string }, unknown, OrderStockItemsDto>,
    res,
  ) => {
    const params = req.params as unknown as OrderReferenceParamsDto;
    const result = await inventoryService.releaseOrderStock(
      params.referenceType,
      params.referenceId,
      req.body,
      actor(req),
    );
    return sendSuccess(res, result);
  },
);
