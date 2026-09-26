import type { InventoryItem, InventoryTransaction } from "@/types/inventory";
import { computeStockStatus } from "@/types/inventory";
import { mockProducts } from "./mock-products";
import { mockBranches } from "./mock-branches";

const ACTIVE_BRANCHES = mockBranches.filter((b) => b.status === "active");

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

function getCategoryName(id: string): string {
  const map: Record<string, string> = {
    "CAT-001": "Feeds",
    "CAT-002": "Fertilizers",
    "CAT-003": "Pesticides",
    "CAT-004": "Veterinary Products",
    "CAT-005": "Seeds",
    "CAT-006": "Tools",
    "CAT-007": "Equipment",
    "CAT-008": "Farm Supplies",
  };
  return map[id] ?? "Uncategorized";
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
    productId: "PRD-001",
    productName: "Premium Hog Feed",
    branchId: "BR-001",
    branchName: "Quezon City Main Branch",
    type: "stock_in",
    quantity: 50,
    previousStock: 70,
    newStock: 120,
    reason: "Supplier delivery",
    performedBy: "Maria Santos",
    date: "2026-09-02T09:00:00Z",
  },
  {
    id: "TXN-2026-00144",
    productId: "PRD-002",
    productName: "Layer Poultry Feed",
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
    productId: "PRD-006",
    productName: "Complete Insecticide Spray",
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
    productId: "PRD-007",
    productName: "Broad-Spectrum Herbicide",
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
    productId: "PRD-009",
    productName: "Multivitamin for Livestock",
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
    productId: "PRD-012",
    productName: "Hybrid Rice Seed",
    branchId: "BR-003",
    branchName: "Davao Branch",
    type: "stock_in",
    quantity: 15,
    previousStock: 19,
    newStock: 34,
    reason: "New supplier shipment",
    performedBy: "Mark Villanueva",
    date: "2026-08-31T08:30:00Z",
  },
  {
    id: "TXN-2026-00139",
    productId: "PRD-001",
    productName: "Premium Hog Feed",
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
    productId: "PRD-005",
    productName: "Urea Fertilizer (46-0-0)",
    branchId: "BR-007",
    branchName: "Pampanga Branch",
    type: "stock_out",
    quantity: 4,
    previousStock: 22,
    newStock: 18,
    reason: "Customer fulfillment — Booking BK-2026-00118",
    performedBy: "Ramon Aquino",
    date: "2026-08-27T09:00:00Z",
  },
];