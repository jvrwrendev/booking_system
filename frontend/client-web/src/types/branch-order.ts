import type { StatusHistoryEntry } from "./order-history";

export type BranchOrderStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "admin_accepted"
  | "processing"
  | "ready"
  | "completed"
  | "ready_for_delivery"
  | "rejected";

export interface BranchOrderItem {
  productName: string;
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