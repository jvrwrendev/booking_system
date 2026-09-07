import type { Booking, BookingItem, BookingStatus } from "@/types/booking";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import { mockBookings } from "./mock/bookings";
import { sleep } from "@/lib/utils";
import { NETWORK_DELAY_MS } from "@/constants";

let bookingsState: Booking[] = [...mockBookings];

function genId(): string {
  const max = bookingsState.reduce((acc, b) => {
    const num = parseInt(b.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(num) && num > acc ? num : acc;
  }, 0);
  return `BK-${String(max + 1).padStart(3, "0")}`;
}

function genReference(): string {
  const max = bookingsState.reduce((acc, b) => {
    const m = b.reference.match(/(\d+)$/);
    const num = m ? parseInt(m[1], 10) : 0;
    return num > acc ? num : acc;
  }, 0);
  return `BK-2026-${String(max + 1).padStart(5, "0")}`;
}

export interface CreateBookingInput {
  customer: Customer;
  agentId: string;
  agentName: string;
  items: BookingItem[];
  notes?: string;
}

export async function listBookingsForAgent(
  agentId: string,
): Promise<Booking[]> {
  await sleep(NETWORK_DELAY_MS);
  return bookingsState.filter((b) => b.agentId === agentId);
}

export async function getBookingForAgent(
  id: string,
  agentId: string,
): Promise<Booking | null> {
  await sleep(NETWORK_DELAY_MS);
  const booking = bookingsState.find((b) => b.id === id);
  if (!booking) return null;
  if (booking.agentId !== agentId) return null;
  return booking;
}

export async function listBookingsForCustomer(
  customerId: string,
  agentId: string,
): Promise<Booking[]> {
  await sleep(NETWORK_DELAY_MS);
  return bookingsState.filter(
    (b) => b.customerId === customerId && b.agentId === agentId,
  );
}

export async function createBookingForAgent(
  input: CreateBookingInput,
): Promise<Booking> {
  await sleep(NETWORK_DELAY_MS);
  const totalQuantity = input.items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = input.items.reduce((acc, i) => acc + i.subtotal, 0);

  const booking: Booking = {
    id: genId(),
    reference: genReference(),
    customerId: input.customer.id,
    customerName: input.customer.fullName,
    agentId: input.agentId,
    agentName: input.agentName,
    bookingDate: new Date().toISOString().slice(0, 10),
    items: input.items,
    totalQuantity,
    subtotal,
    discount: 0,
    totalAmount: subtotal,
    status: "pending" satisfies BookingStatus,
    createdAt: new Date().toISOString(),
    notes: input.notes,
    statusHistory: [
      {
        id: `${genId()}-h1`,
        from: "pending",
        to: "pending",
        label: "Booking Created",
        timestamp: new Date().toISOString(),
        by: input.agentName,
      },
    ],
  };

  bookingsState = [booking, ...bookingsState];
  return booking;
}

export function summarizeBookingItems(items: BookingItem[]) {
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  return { totalQuantity, subtotal, totalAmount: subtotal };
}

export function buildBookingItem(
  product: Product,
  quantity: number,
): BookingItem {
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
