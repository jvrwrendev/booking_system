import type { StatusHistoryEntry } from "./order-history";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "processing"
  | "ready"
  | "completed"
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
  bookingDate: string;
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

export const BOOKING_STATUS_FLOW: BookingStatus[] = [
  "pending",
  "accepted",
  "assigned",
  "processing",
  "ready",
  "completed",
];

export const TERMINAL_BOOKING_STATUSES: BookingStatus[] = [
  "completed",
  "rejected",
];

export function isBookingTerminal(status: BookingStatus): boolean {
  return TERMINAL_BOOKING_STATUSES.includes(status);
}
