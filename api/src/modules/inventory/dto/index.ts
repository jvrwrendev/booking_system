import { z } from "zod";

const STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "CRITICAL",
  "OUT_OF_STOCK",
] as const;

const TRANSACTION_TYPES = [
  "STOCK_IN",
  "STOCK_OUT",
  "ADJUSTMENT",
  "TRANSFER",
  "RESERVATION",
  "RELEASE",
  "ORDER_COMMIT",
  "ORDER_RELEASE",
] as const;

export const inventoryListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  productId: z.string().trim().max(100).optional(),
  categoryId: z.string().trim().max(100).optional(),
  branchId: z.string().trim().max(100).optional(),
  status: z.enum(STOCK_STATUSES).optional(),
  sortBy: z
    .enum(["productName", "currentStock", "updatedAt"])
    .default("productName"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const inventorySummaryQueryDto = z.object({
  branchId: z.string().trim().max(100).optional(),
});

export const inventoryAlertsQueryDto = z.object({
  branchId: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const transactionListQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  productId: z.string().trim().max(100).optional(),
  branchId: z.string().trim().max(100).optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

const stockTarget = {
  productId: z.string().min(1, "Product is required").max(100),
  branchId: z.string().trim().max(100).optional(),
};

export const stockInDto = z.object({
  ...stockTarget,
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero").max(9_999_999),
  reason: z.string().trim().max(500).optional(),
});

export const stockOutDto = z.object({
  ...stockTarget,
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero").max(9_999_999),
  reason: z.string().trim().max(500).optional(),
});

export const stockAdjustmentDto = z.object({
  ...stockTarget,
  quantity: z
    .coerce.number()
    .int()
    .refine((value) => value !== 0, "Adjustment cannot be zero")
    .refine(
      (value) => Math.abs(value) <= 9_999_999,
      "Adjustment is too large",
    ),
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export const stockTransferDto = z
  .object({
    productId: z.string().min(1, "Product is required").max(100),
    fromBranchId: z.string().min(1, "Source branch is required").max(100),
    toBranchId: z.string().min(1, "Destination branch is required").max(100),
    quantity: z.coerce.number().int().positive("Quantity must be greater than zero").max(9_999_999),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.fromBranchId !== data.toBranchId, {
    message: "Source and destination branches must differ",
    path: ["toBranchId"],
  });

export const orderReferenceParamsDto = z.object({
  referenceType: z.enum(["booking", "branch_order"]),
  referenceId: z.string().min(1, "Reference id is required").max(120),
});

export const orderStockItemsDto = z.object({
  branchId: z.string().trim().max(100).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().max(100).optional(),
        sku: z.string().trim().max(80).optional(),
        productName: z.string().trim().max(255).optional(),
        quantity: z.coerce.number().int().positive().max(9_999_999),
      }),
    )
    .min(1, "At least one item is required"),
});

export type InventoryListQueryDto = z.infer<typeof inventoryListQueryDto>;
export type InventorySummaryQueryDto = z.infer<typeof inventorySummaryQueryDto>;
export type InventoryAlertsQueryDto = z.infer<typeof inventoryAlertsQueryDto>;
export type TransactionListQueryDto = z.infer<typeof transactionListQueryDto>;
export type StockInDto = z.infer<typeof stockInDto>;
export type StockOutDto = z.infer<typeof stockOutDto>;
export type StockAdjustmentDto = z.infer<typeof stockAdjustmentDto>;
export type StockTransferDto = z.infer<typeof stockTransferDto>;
export type OrderReferenceParamsDto = z.infer<typeof orderReferenceParamsDto>;
export type OrderStockItemsDto = z.infer<typeof orderStockItemsDto>;
