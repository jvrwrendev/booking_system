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
  /**
   * True once the ordered quantities have been deducted from product stock.
   * Guards the deduct/restore pair so confirming twice cannot deduct twice and
   * cancelling an uncommitted booking cannot create phantom stock.
   */
  stockCommitted?: boolean;
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

/** Statuses that hand the ordered stock back to the catalog. */
export const RELEASING_STATUSES: BookingStatus[] = ["cancelled", "rejected"];

export function isReleasingStatus(status: BookingStatus): boolean {
  return RELEASING_STATUSES.includes(status);
}

/**
 * Whether a booking can still change product stock.
 *
 * Every status except the terminal ones qualifies. A completed or
 * ready-for-delivery booking consumed its units, and a cancelled or rejected one
 * already returned them, so none of them needs the product to still exist.
 * Anything earlier may yet be accepted, which deducts stock, or cancelled, which
 * returns it.
 *
 * Used to block deleting a product a live booking still depends on. It reads
 * only the status on purpose: deriving it from `stockCommitted` would make the
 * answer depend on a flag that is legitimately false for an open booking.
 */
export function canAffectStock(booking: Pick<Booking, "status">): boolean {
  return !isTerminalStatus(booking.status);
}
