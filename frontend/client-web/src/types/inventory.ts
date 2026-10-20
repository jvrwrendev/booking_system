export type StockStatus = "in_stock" | "low_stock" | "critical" | "out_of_stock";

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  branchId: string;
  branchName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  status: StockStatus;
  updatedAt: string;
}

export type TransactionType =
  | "stock_in"
  | "stock_out"
  | "adjustment"
  | "transfer"
  | "reservation"
  | "release";

export interface InventoryTransaction {
  id: string;
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  type: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  date: string;
}

export function computeStockStatus(
  current: number,
  minimum: number
): StockStatus {
  if (current <= 0) return "out_of_stock";
  if (current <= Math.max(Math.floor(minimum / 2), 1)) return "critical";
  if (current <= minimum) return "low_stock";
  return "in_stock";
}