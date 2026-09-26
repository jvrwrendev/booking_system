import { getStockStatus, type StockStatus } from "@/lib/stock";

export type { StockStatus };

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

export const computeStockStatus = getStockStatus;