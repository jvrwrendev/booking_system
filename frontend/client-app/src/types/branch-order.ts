import type { StatusHistoryEntry } from "./order-history";

export type BranchOrderStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "admin_accepted"
  | "processing"
  | "ready"
  | "completed"
  | "ready_for_delivery"
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
  branchManager?: string | null;
  branchContact?: string | null;
  branchAddress?: string | null;
  orderDate: string;
  items: BranchOrderItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BranchOrderStatus;
  createdAt: string;
  updatedAt?: string;
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
  "admin_accepted",
  "processing",
  "ready",
  "completed",
  "ready_for_delivery",
];

export const TERMINAL_BRANCH_ORDER_STATUSES: BranchOrderStatus[] = [
  "ready_for_delivery",
  "rejected",
];

export function isBranchOrderTerminal(status: BranchOrderStatus): boolean {
  return TERMINAL_BRANCH_ORDER_STATUSES.includes(status);
}
