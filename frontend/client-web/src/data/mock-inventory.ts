import type { InventoryItem, InventoryTransaction } from "@/types/inventory";
import { computeStockStatus } from "@/types/inventory";
import { mockProducts } from "./mock-products";
import { mockCategories } from "./mock-categories";
import { mockBranches } from "./mock-branches";

const ACTIVE_BRANCHES = mockBranches.filter((b) => b.status === "active");

function getCategoryName(id: string): string {
  return mockCategories.find((c) => c.id === id)?.name ?? "Uncategorized";
}

function buildInventoryItem(
  productIdx: number,
  branchIdx: number
): InventoryItem {
  const product = mockProducts[productIdx];
  const branch = ACTIVE_BRANCHES[branchIdx];
  const baseStock = product.stockQuantity;
  const stockAtBranch = Math.max(0, Math.round(baseStock * (0.3 + (branchIdx * 0.15) % 0.6)));
  const reserved = Math.round(stockAtBranch * 0.1);
  return {
    id: `INV-${product.id}-${branch.id}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    categoryName: getCategoryName(product.categoryId),
    branchId: branch.id,
    branchName: branch.name,
    currentStock: stockAtBranch,
    reservedStock: reserved,
    availableStock: Math.max(0, stockAtBranch - reserved),
    minimumStock: product.minimumStockLevel,
    status: computeStockStatus(stockAtBranch, product.minimumStockLevel),
    updatedAt: "2026-09-03T08:00:00Z",
  };
}

const inventoryItems: InventoryItem[] = [];

mockProducts.forEach((_, pIdx) => {
  ACTIVE_BRANCHES.forEach((_, bIdx) => {
    if ((pIdx + bIdx) % 3 === 0 || bIdx === 0) {
      inventoryItems.push(buildInventoryItem(pIdx, bIdx));
    }
  });
});

export const mockInventory: InventoryItem[] = inventoryItems;

export const mockTransactions: InventoryTransaction[] = [
  {
    id: "TXN-2026-00145",
    productId: "PRD-010",
    productName: "Poultry Feed 50kg",
    branchId: "BR-001",
    branchName: "Quezon City Main Branch",
    type: "stock_in",
    quantity: 10,
    previousStock: 15,
    newStock: 25,
    reason: "Supplier delivery",
    performedBy: "Maria Santos",
    date: "2026-09-02T09:00:00Z",
  },
  {
    id: "TXN-2026-00144",
    productId: "PRD-012",
    productName: "Broiler Starter Feed 25kg",
    branchId: "BR-001",
    branchName: "Quezon City Main Branch",
    type: "stock_out",
    quantity: 12,
    previousStock: 20,
    newStock: 8,
    reason: "Customer fulfillment — Booking BK-2026-00123",
    performedBy: "Roberto Garcia",
    date: "2026-09-02T14:30:00Z",
  },
  {
    id: "TXN-2026-00143",
    productId: "PRD-016",
    productName: "Organic Fertilizer 50kg",
    branchId: "BR-002",
    branchName: "Cebu City Branch",
    type: "transfer",
    quantity: 20,
    previousStock: 75,
    newStock: 95,
    reason: "Transfer from Davao Branch",
    performedBy: "Liza Tan",
    date: "2026-09-01T11:00:00Z",
  },
  {
    id: "TXN-2026-00142",
    productId: "PRD-023",
    productName: "Cat Litter 10kg",
    branchId: "BR-002",
    branchName: "Cebu City Branch",
    type: "adjustment",
    quantity: -8,
    previousStock: 8,
    newStock: 0,
    reason: "Stock count adjustment",
    performedBy: "Liza Tan",
    date: "2026-09-01T16:00:00Z",
  },
  {
    id: "TXN-2026-00141",
    productId: "PRD-006",
    productName: "Vitamin B-Complex",
    branchId: "BR-004",
    branchName: "Iloilo Branch",
    type: "reservation",
    quantity: 4,
    previousStock: 50,
    newStock: 50,
    reason: "Booking BK-2026-00121 reserved",
    performedBy: "Anna Reyes",
    date: "2026-09-01T10:00:00Z",
  },
  {
    id: "TXN-2026-00140",
    productId: "PRD-011",
    productName: "Hog Grower Feed 50kg",
    branchId: "BR-003",
    branchName: "Davao Branch",
    type: "stock_in",
    quantity: 15,
    previousStock: 25,
    newStock: 40,
    reason: "New supplier shipment",
    performedBy: "Mark Villanueva",
    date: "2026-08-31T08:30:00Z",
  },
  {
    id: "TXN-2026-00139",
    productId: "PRD-010",
    productName: "Poultry Feed 50kg",
    branchId: "BR-001",
    branchName: "Quezon City Main Branch",
    type: "release",
    quantity: 4,
    previousStock: 50,
    newStock: 50,
    reason: "Released expired reservation",
    performedBy: "Roberto Garcia",
    date: "2026-08-30T15:00:00Z",
  },
  {
    id: "TXN-2026-00138",
    productId: "PRD-017",
    productName: "Urea Fertilizer 50kg",
    branchId: "BR-007",
    branchName: "Pampanga Branch",
    type: "stock_out",
    quantity: 4,
    previousStock: 9,
    newStock: 5,
    reason: "Customer fulfillment — Booking BK-2026-00118",
    performedBy: "Ramon Aquino",
    date: "2026-08-27T09:00:00Z",
  },
];