import type { BranchOrder, BranchOrderItem } from "@/types/branch-order";
import type { Product } from "@/types/product";
import { mockBranchOrders } from "./mock/branch-orders";
import { sleep } from "@/lib/utils";
import { NETWORK_DELAY_MS } from "@/constants";

let ordersState: BranchOrder[] = [...mockBranchOrders];

function genId(): string {
  const max = ordersState.reduce((acc, o) => {
    const num = parseInt(o.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(num) && num > acc ? num : acc;
  }, 0);
  return `BO-${String(max + 1).padStart(3, "0")}`;
}

function genReference(): string {
  const max = ordersState.reduce((acc, o) => {
    const m = o.reference.match(/(\d+)$/);
    const num = m ? parseInt(m[1], 10) : 0;
    return num > acc ? num : acc;
  }, 0);
  return `BO-2026-${String(max + 1).padStart(4, "0")}`;
}

export interface CreateBranchOrderInput {
  branchId: string;
  branchName: string;
  items: BranchOrderItem[];
  notes?: string;
}

export async function listOrdersForBranch(
  branchId: string,
): Promise<BranchOrder[]> {
  await sleep(NETWORK_DELAY_MS);
  return ordersState.filter((o) => o.branchId === branchId);
}

export async function getOrderForBranch(
  id: string,
  branchId: string,
): Promise<BranchOrder | null> {
  await sleep(NETWORK_DELAY_MS);
  const order = ordersState.find((o) => o.id === id);
  if (!order) return null;
  if (order.branchId !== branchId) return null;
  return order;
}

export async function createBranchOrder(
  input: CreateBranchOrderInput,
): Promise<BranchOrder> {
  await sleep(NETWORK_DELAY_MS);
  const totalQuantity = input.items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = input.items.reduce((acc, i) => acc + i.subtotal, 0);

  const order: BranchOrder = {
    id: genId(),
    reference: genReference(),
    branchId: input.branchId,
    branchName: input.branchName,
    orderDate: new Date().toISOString().slice(0, 10),
    items: input.items,
    totalQuantity,
    subtotal,
    discount: 0,
    totalAmount: subtotal,
    status: "pending",
    createdAt: new Date().toISOString(),
    notes: input.notes,
    statusHistory: [
      {
        id: `${genId()}-h1`,
        from: "pending",
        to: "pending",
        label: "Order Created",
        timestamp: new Date().toISOString(),
        by: input.branchName,
      },
    ],
  };

  ordersState = [order, ...ordersState];
  return order;
}

export function summarizeOrderItems(items: BranchOrderItem[]) {
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  return { totalQuantity, subtotal, totalAmount: subtotal };
}

export function buildBranchOrderItem(
  product: Product,
  quantity: number,
): BranchOrderItem {
  const subtotal = product.sellingPrice * quantity;
  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity,
    unitPrice: product.sellingPrice,
    subtotal,
  };
}
