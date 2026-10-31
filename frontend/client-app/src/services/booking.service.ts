import { ApiError, request } from "@/lib/api-client";
import type { Booking, BookingItem, BookingStatus } from "@/types/booking";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";

/**
 * Wire shapes returned by `api/src/modules/bookings`. The mobile app keeps
 * its own camelCase, lowercase-status model and maps at the service boundary.
 */
type ApiBookingStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED"
  | "ADMIN_ACCEPTED"
  | "REVIEW_ORDER"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "READY_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

interface ApiBookingItem {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ApiBookingStatusHistory {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: string;
  by: string;
}

interface ApiBooking {
  id: string;
  reference: string;
  customerId: string | null;
  customerName: string;
  customerContact: string | null;
  customerAddress: string | null;
  agentId: string | null;
  agentName: string;
  branchId: string;
  branchName: string;
  bookingDate: string;
  pickupDate: string;
  items: ApiBookingItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: ApiBookingStatus;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignmentDate: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: ApiBookingStatusHistory[];
}

interface ApiBookingList {
  bookings: ApiBooking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiBookingResponse {
  booking: ApiBooking;
}

interface ApiBranch {
  id: string;
  name: string;
  code: string | null;
  status: "ACTIVE" | "INACTIVE";
}

interface ApiBranchList {
  branches: ApiBranch[];
}

export interface BookingBranchOption {
  id: string;
  name: string;
  code: string | null;
}

const LIST_PAGE_SIZE = 100;

function toBookingStatus(status: ApiBookingStatus): BookingStatus {
  return status.toLowerCase() as BookingStatus;
}

function toBooking(dto: ApiBooking): Booking {
  return {
    id: dto.id,
    reference: dto.reference,
    customerId: dto.customerId ?? "",
    customerName: dto.customerName,
    customerContact: dto.customerContact ?? undefined,
    customerAddress: dto.customerAddress ?? undefined,
    agentId: dto.agentId ?? "",
    agentName: dto.agentName,
    branchId: dto.branchId,
    branchName: dto.branchName,
    bookingDate: dto.bookingDate.slice(0, 10),
    pickupDate: dto.pickupDate,
    items: dto.items.map((item) => ({
      productId: item.productId ?? "",
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    totalQuantity: dto.totalQuantity,
    subtotal: dto.subtotal,
    discount: dto.discount,
    totalAmount: dto.totalAmount,
    status: toBookingStatus(dto.status),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    notes: dto.notes ?? undefined,
    assignedAdminId: dto.assignedAdminId,
    assignedAdminName: dto.assignedAdminName,
    assignedById: dto.assignedById,
    assignedByName: dto.assignedByName,
    assignmentDate: dto.assignmentDate,
    statusHistory: dto.statusHistory.map((entry) => ({
      id: entry.id,
      from: entry.from,
      to: entry.to,
      label: entry.label,
      timestamp: entry.timestamp,
      by: entry.by,
    })),
  };
}

/** Active branches an agent can book against. */
export async function listBookingBranches(): Promise<BookingBranchOption[]> {
  const { branches } = await request<ApiBranchList>("/inventory/branches");
  return branches
    .filter((branch) => branch.status === "ACTIVE")
    .map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
    }));
}

export async function listBookingsForAgent(
  agentId?: string,
): Promise<Booking[]> {
  const data = await request<ApiBookingList>(
    `/bookings?page=${1}&pageSize=${LIST_PAGE_SIZE}&sortBy=createdAt&sortOrder=desc`,
  );
  const bookings = data.bookings.map(toBooking);
  return agentId
    ? bookings.filter((booking) => booking.agentId === agentId)
    : bookings;
}

export async function getBookingForAgent(
  id: string,
  agentId?: string,
): Promise<Booking | null> {
  try {
    const { booking } = await request<ApiBookingResponse>(
      `/bookings/${encodeURIComponent(id)}`,
    );
    const mapped = toBooking(booking);
    if (agentId && mapped.agentId !== agentId) return null;
    return mapped;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function listBookingsForCustomer(
  customerId: string,
  agentId?: string,
): Promise<Booking[]> {
  const bookings = await listBookingsForAgent(agentId);
  return bookings.filter((booking) => booking.customerId === customerId);
}

export interface CreateBookingInput {
  customer: Customer;
  agentId: string;
  agentName: string;
  branchId: string;
  items: BookingItem[];
  notes?: string;
}

export async function createBookingForAgent(
  input: CreateBookingInput,
): Promise<Booking> {
  const now = new Date().toISOString();
  const { booking } = await request<ApiBookingResponse>("/bookings", {
    method: "POST",
    body: {
      customerId: input.customer.id || undefined,
      customerName: input.customer.fullName,
      customerContact: input.customer.contactNumber || undefined,
      customerAddress: input.customer.address || undefined,
      agentId: input.agentId || undefined,
      agentName: input.agentName,
      branchId: input.branchId,
      bookingDate: now,
      pickupDate: now,
      items: input.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
    },
  });
  return toBooking(booking);
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  note?: string,
): Promise<Booking | null> {
  try {
    const { booking } = await request<ApiBookingResponse>(
      `/bookings/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        body: {
          status: status.toUpperCase() as ApiBookingStatus,
          ...(note ? { note } : {}),
        },
      },
    );
    return toBooking(booking);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
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
