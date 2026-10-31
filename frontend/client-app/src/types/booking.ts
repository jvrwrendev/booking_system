import type { StatusHistoryEntry } from "./order-history";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "admin_accepted"
  | "review_order"
  | "confirmed"
  | "processing"
  | "ready"
  | "ready_for_delivery"
  | "completed"
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
  customerContact?: string;
  customerAddress?: string;
  agentId: string;
  agentName: string;
  branchId: string;
  branchName: string;
  bookingDate: string;
  pickupDate?: string;
  items: BookingItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BookingStatus;
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

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  "pending",
  "accepted",
  "assigned",
  "admin_accepted",
  "review_order",
  "processing",
  "ready",
  "ready_for_delivery",
  "completed",
];

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  "completed",
  "cancelled",
  "rejected",
];

export function isBookingTerminal(status: BookingStatus): boolean {
  return TERMINAL_BOOKING_STATUSES.includes(status);
}
