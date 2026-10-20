import type { StatusHistoryEntry } from "./order-history";

export type BranchOrderStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "processing"
  | "ready"
  | "completed"
  | "rejected";

export interface BranchOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BranchOrder {
  id: string;
  reference: string;
  branchId: string;
  branchName: string;
  orderDate: string;
  items: BranchOrderItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BranchOrderStatus;
  createdAt: string;
  notes?: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  assignedById?: string | null;
  assignedByName?: string | null;
  assignmentDate?: string | null;
  statusHistory?: StatusHistoryEntry[];
}

export const BRANCH_ORDER_STATUS_FLOW: BranchOrderStatus[] = [
  "pending",
  "accepted",
  "assigned",
  "processing",
  "ready",
  "completed",
];

export const TERMINAL_BRANCH_ORDER_STATUSES: BranchOrderStatus[] = [
  "completed",
  "rejected",
];

export function isBranchOrderTerminal(status: BranchOrderStatus): boolean {
  return TERMINAL_BRANCH_ORDER_STATUSES.includes(status);
}
