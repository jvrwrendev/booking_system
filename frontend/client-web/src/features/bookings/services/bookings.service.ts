import { request } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";
import type {
  ApplyBookingDiscountPayloadDto,
  AssignBookingPayloadDto,
  BookingDto,
  BookingStatusDto,
  CreateBookingPayloadDto,
  ListBookingsResponseDto,
  UpdateBookingPayloadDto,
} from "@/types/api";
import type { Booking, BookingStatus } from "@/types/booking";

interface BookingUserDto {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  agentId?: string | null;
  createdAt: string;
}

export interface BookingAgentOption {
  id: string;
  name: string;
  agentId: string | null;
}

/** Active mobile agents, sourced from the shared users table. */
export async function listBookingAgents(): Promise<BookingAgentOption[]> {
  const result = await request<{ users: BookingUserDto[] }>("/users", {
    query: { role: "AGENT", status: "ACTIVE", pageSize: 100 },
  });
  return result.users.map((user) => ({
    id: user.id,
    name: user.name,
    agentId: user.agentId ?? null,
  }));
}

/** Active admins that can be assigned a booking. */
export async function listAssignableAdmins(): Promise<AuthUser[]> {
  const [admins, superAdmins] = await Promise.all([
    request<{ users: BookingUserDto[] }>("/users", {
      query: { role: "ADMIN", status: "ACTIVE", pageSize: 100 },
    }),
    request<{ users: BookingUserDto[] }>("/users", {
      query: { role: "SUPER_ADMIN", status: "ACTIVE", pageSize: 100 },
    }),
  ]);

  return [...admins.users, ...superAdmins.users].map((user) => ({
    id: user.id,
    fullName: user.name,
    email: user.email,
    role: user.role as AuthUser["role"],
    status: user.status.toLowerCase() as AuthUser["status"],
    createdAt: user.createdAt,
  }));
}

export interface ListBookingsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  branchId?: string;
  agentId?: string;
  assignedAdminId?: string;
  assignment?: "assigned" | "unassigned";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function toBookingStatus(status: BookingStatusDto): BookingStatus {
  return status.toLowerCase() as BookingStatus;
}

export function toBooking(dto: BookingDto): Booking {
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
    bookingDate: dto.bookingDate,
    pickupDate: dto.pickupDate,
    items: dto.items.map((item) => ({
      id: item.id,
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

export async function listBookings(
  params: ListBookingsParams = {},
): Promise<{
  bookings: Booking[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const result = await request<ListBookingsResponseDto>("/bookings", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status:
        params.status && params.status !== "all"
          ? (params.status.toUpperCase() as BookingStatusDto)
          : undefined,
      branchId:
        params.branchId && params.branchId !== "all"
          ? params.branchId
          : undefined,
      agentId:
        params.agentId && params.agentId !== "all" ? params.agentId : undefined,
      assignedAdminId: params.assignedAdminId,
      assignment: params.assignment,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });

  return {
    ...result,
    bookings: result.bookings.map(toBooking),
  };
}

export async function getBooking(id: string): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>(
    `/bookings/${encodeURIComponent(id)}`,
  );
  return toBooking(booking);
}

export async function createBooking(
  payload: CreateBookingPayloadDto,
): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>("/bookings", {
    method: "POST",
    body: payload,
  });
  return toBooking(booking);
}

export async function updateBooking(
  id: string,
  payload: UpdateBookingPayloadDto,
): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>(
    `/bookings/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload },
  );
  return toBooking(booking);
}

export async function deleteBooking(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/bookings/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  note?: string,
): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>(
    `/bookings/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: {
        status: status.toUpperCase() as BookingStatusDto,
        ...(note ? { note } : {}),
      },
    },
  );
  return toBooking(booking);
}

export async function assignBooking(
  id: string,
  payload: AssignBookingPayloadDto,
): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>(
    `/bookings/${encodeURIComponent(id)}/assign`,
    { method: "PATCH", body: payload },
  );
  return toBooking(booking);
}

export async function unassignBooking(id: string): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>(
    `/bookings/${encodeURIComponent(id)}/assignment`,
    { method: "DELETE" },
  );
  return toBooking(booking);
}

export async function applyBookingDiscount(
  id: string,
  payload: ApplyBookingDiscountPayloadDto,
): Promise<Booking> {
  const { booking } = await request<{ booking: BookingDto }>(
    `/bookings/${encodeURIComponent(id)}/discount`,
    { method: "PATCH", body: payload },
  );
  return toBooking(booking);
}
