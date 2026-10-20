import type { StatusHistoryEntry } from "./order-history";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "admin_accepted"
  | "confirmed"
  | "processing"
  | "ready"
  | "completed"
  | "ready_for_delivery"
  | "cancelled"
  | "rejected";

export interface BookingItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Booking {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  branchId: string;
  branchName: string;
  bookingDate: string;
  pickupDate: string;
  items: BookingItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  notes?: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  assignedById?: string | null;
  assignedByName?: string | null;
  assignmentDate?: string | null;
  statusHistory?: StatusHistoryEntry[];
}

export interface BookingTimelineEvent {
  id: string;
  status: BookingStatus;
  description: string;
  timestamp: string;
  by: string;
}

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  "pending",
  "accepted",
  "assigned",
  "admin_accepted",
  "processing",
  "ready",
  "completed",
  "ready_for_delivery",
];

export const TERMINAL_STATUSES: BookingStatus[] = [
  "completed",
  "ready_for_delivery",
  "cancelled",
  "rejected",
];

export function isTerminalStatus(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
