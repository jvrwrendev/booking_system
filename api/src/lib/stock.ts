import type { ProductStatus, StockStatus } from "@prisma/client";

export function computeStockStatus(
  currentStock: number,
  minimumStock: number,
): StockStatus {
  if (currentStock <= 0) return "OUT_OF_STOCK";
  if (currentStock <= Math.max(Math.floor(minimumStock / 2), 1)) {
    return "CRITICAL";
  }
  if (currentStock <= minimumStock) return "LOW_STOCK";
  return "IN_STOCK";
}

/**
 * Catalog status is derived from stock unless an admin explicitly disabled the
 * product. A restocked product that was automatically marked out of stock
 * becomes active again.
 */
export function deriveProductStatus(
  currentStatus: ProductStatus,
  totalStock: number,
): ProductStatus {
  if (currentStatus === "INACTIVE") return "INACTIVE";
  if (totalStock <= 0) return "OUT_OF_STOCK";
  if (currentStatus === "OUT_OF_STOCK") return "ACTIVE";
  return currentStatus;
}

export function productStockStatus(totalStock: number, minimumStock: number): StockStatus {
  return computeStockStatus(totalStock, minimumStock);
}
