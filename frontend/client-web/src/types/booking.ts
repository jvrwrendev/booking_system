export type BookingStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "ready"
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
  "confirmed",
  "processing",
  "ready",
  "completed",
];