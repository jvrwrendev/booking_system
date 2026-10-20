import { request } from "@/lib/api-client";
import type {
  InventoryBranchDto,
  InventoryItemDto,
  InventorySummaryDto,
  InventoryTransactionTypeDto,
  InventoryTransactionDto,
  ListInventoryResponseDto,
  ListInventoryTransactionsResponseDto,
  OrderStockItemDto,
  OrderStockPayloadDto,
  StockMovementPayloadDto,
  StockStatusDto,
  TransferStockPayloadDto,
} from "@/types/api";
import type {
  InventoryBranch,
  InventoryItem,
  InventorySummary,
  InventoryTransaction,
  StockStatus,
  TransactionType,
} from "@/types/inventory";

export interface ListInventoryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  branchId?: string;
  /** "all" or a lowercase stock status. */
  status?: string;
  sortBy?: "productName" | "currentStock" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface ListTransactionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  productId?: string;
  branchId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

function fromStockStatusDto(status: StockStatusDto): StockStatus {
  switch (status) {
    case "LOW_STOCK":
      return "low_stock";
    case "CRITICAL":
      return "critical";
    case "OUT_OF_STOCK":
      return "out_of_stock";
    default:
      return "in_stock";
  }
}

function toStockStatusDto(status: string | undefined): StockStatusDto | undefined {
  switch (status) {
    case "in_stock":
      return "IN_STOCK";
    case "low_stock":
      return "LOW_STOCK";
    case "critical":
      return "CRITICAL";
    case "out_of_stock":
      return "OUT_OF_STOCK";
    default:
      return undefined;
  }
}

function fromTransactionTypeDto(type: string): TransactionType {
  return type.toLowerCase() as TransactionType;
}

export function toInventoryItem(dto: InventoryItemDto): InventoryItem {
  return {
    id: dto.id,
    productId: dto.productId,
    productName: dto.productName,
    sku: dto.sku,
    categoryId: dto.categoryId ?? "",
    categoryName: dto.categoryName,
    branchId: dto.branchId,
    branchName: dto.branchName,
    currentStock: dto.currentStock,
    reservedStock: dto.reservedStock,
    availableStock: dto.availableStock,
    minimumStock: dto.minimumStock,
    status: fromStockStatusDto(dto.status),
    updatedAt: dto.updatedAt,
  };
}

export function toInventoryTransaction(
  dto: InventoryTransactionDto,
): InventoryTransaction {
  return {
    id: dto.id,
    productId: dto.productId,
    productName: dto.productName,
    branchId: dto.branchId,
    branchName: dto.branchName,
    type: fromTransactionTypeDto(dto.type),
    quantity: dto.quantity,
    previousStock: dto.previousStock,
    newStock: dto.newStock,
    reason: dto.reason,
    performedBy: dto.performedBy,
    referenceType: dto.referenceType,
    referenceId: dto.referenceId,
    date: dto.date,
  };
}

export function listInventory(
  params: ListInventoryParams = {},
): Promise<ListInventoryResponseDto> {
  return request<ListInventoryResponseDto>("/inventory", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      categoryId:
        params.categoryId && params.categoryId !== "all"
          ? params.categoryId
          : undefined,
      branchId:
        params.branchId && params.branchId !== "all"
          ? params.branchId
          : undefined,
      status: toStockStatusDto(params.status),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
}

export async function getInventorySummary(
  branchId?: string,
): Promise<InventorySummary> {
  const { summary } = await request<{ summary: InventorySummaryDto }>(
    "/inventory/summary",
    {
      query: { branchId: branchId && branchId !== "all" ? branchId : undefined },
    },
  );

  return {
    totalProducts: summary.totalProducts,
    totalUnits: summary.totalUnits,
    inventoryValue: summary.inventoryValue,
    lowStockCount: summary.lowStockCount,
    criticalCount: summary.criticalCount,
    outOfStockCount: summary.outOfStockCount,
    alerts: summary.alerts.map(toInventoryItem),
  };
}

export async function listInventoryAlerts(
  branchId?: string,
  limit = 20,
): Promise<InventoryItem[]> {
  const { alerts } = await request<{ alerts: InventoryItemDto[] }>(
    "/inventory/alerts",
    {
      query: {
        branchId: branchId && branchId !== "all" ? branchId : undefined,
        limit,
      },
    },
  );
  return alerts.map(toInventoryItem);
}

export async function listInventoryBranches(): Promise<InventoryBranch[]> {
  const { branches } = await request<{ branches: InventoryBranchDto[] }>(
    "/inventory/branches",
  );
  return branches.map((branch) => ({
    id: branch.id,
    name: branch.name,
    code: branch.code,
    status: branch.status === "ACTIVE" ? "active" : "inactive",
  }));
}

export async function listInventoryTransactions(
  params: ListTransactionsParams = {},
): Promise<ListInventoryTransactionsResponseDto> {
  return request<ListInventoryTransactionsResponseDto>(
    "/inventory/transactions",
    {
      query: {
        page: params.page,
        pageSize: params.pageSize,
        search: params.search,
        productId: params.productId,
        branchId:
          params.branchId && params.branchId !== "all"
            ? params.branchId
            : undefined,
        type:
          params.type && params.type !== "all"
            ? (params.type.toUpperCase() as InventoryTransactionTypeDto)
            : undefined,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    },
  );
}

export async function stockIn(
  payload: StockMovementPayloadDto,
): Promise<InventoryItem> {
  const { item } = await request<{ item: InventoryItemDto }>(
    "/inventory/stock-in",
    { method: "POST", body: payload },
  );
  return toInventoryItem(item);
}

export async function stockOut(
  payload: StockMovementPayloadDto,
): Promise<InventoryItem> {
  const { item } = await request<{ item: InventoryItemDto }>(
    "/inventory/stock-out",
    { method: "POST", body: payload },
  );
  return toInventoryItem(item);
}

export async function adjustStock(
  payload: StockMovementPayloadDto,
): Promise<InventoryItem> {
  const { item } = await request<{ item: InventoryItemDto }>(
    "/inventory/adjustments",
    { method: "POST", body: payload },
  );
  return toInventoryItem(item);
}

export async function transferStock(
  payload: TransferStockPayloadDto,
): Promise<InventoryItem> {
  const { item } = await request<{ item: InventoryItemDto }>(
    "/inventory/transfers",
    { method: "POST", body: payload },
  );
  return toInventoryItem(item);
}

function toOrderPayload(
  branchId: string | undefined,
  items: OrderStockItemDto[],
): OrderStockPayloadDto {
  return {
    branchId: branchId || undefined,
    items,
  };
}

export async function commitOrderStock(
  referenceType: "booking" | "branch_order",
  referenceId: string,
  branchId: string | undefined,
  items: OrderStockItemDto[],
): Promise<{ committed: number; skipped: number }> {
  return request<{ committed: number; skipped: number }>(
    `/inventory/orders/${referenceType}/${encodeURIComponent(referenceId)}/commit`,
    { method: "POST", body: toOrderPayload(branchId, items) },
  );
}

export async function releaseOrderStock(
  referenceType: "booking" | "branch_order",
  referenceId: string,
  branchId: string | undefined,
  items: OrderStockItemDto[],
): Promise<{ released: number; skipped: number }> {
  return request<{ released: number; skipped: number }>(
    `/inventory/orders/${referenceType}/${encodeURIComponent(referenceId)}/release`,
    { method: "POST", body: toOrderPayload(branchId, items) },
  );
}
