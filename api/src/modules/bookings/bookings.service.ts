import { randomUUID } from "node:crypto";
import type { BookingStatus, Prisma, Role } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import {
  commitOrderStockInTransaction,
  releaseOrderStockInTransaction,
  type InventoryActor,
} from "../inventory/inventory.service.js";
import type {
  ApplyBookingDiscountDto,
  AssignBookingDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from "./dto/index.js";

const BOOKING_INCLUDE = {
  items: { orderBy: { createdAt: "asc" } },
  statusHistory: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.BookingInclude;

type BookingRecord = Prisma.BookingGetPayload<{
  include: typeof BOOKING_INCLUDE;
}>;

export interface BookingActor {
  id: string;
  name: string;
  role?: Role;
  branchId?: string | null;
}

export interface BookingItemView {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BookingStatusHistoryView {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: Date;
  by: string;
}

export interface BookingView {
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
  bookingDate: Date;
  pickupDate: Date;
  items: BookingItemView[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BookingStatus;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignmentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: BookingStatusHistoryView[];
}

export interface ListBookingsResult {
  bookings: BookingView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ASSIGNED: "Assigned",
  ADMIN_ACCEPTED: "Admin accepted",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  READY_FOR_DELIVERY: "Ready for delivery",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["ASSIGNED", "REJECTED", "CANCELLED"],
  ASSIGNED: ["ADMIN_ACCEPTED", "REJECTED", "CANCELLED"],
  ADMIN_ACCEPTED: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: ["READY_FOR_DELIVERY"],
  READY_FOR_DELIVERY: [],
  CANCELLED: [],
  REJECTED: [],
};

const TERMINAL_STATUSES = new Set<BookingStatus>([
  "COMPLETED",
  "READY_FOR_DELIVERY",
  "CANCELLED",
  "REJECTED",
]);

const STOCK_COMMITTED_STATUSES = new Set<BookingStatus>([
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "READY_FOR_DELIVERY",
]);

function toBookingView(booking: BookingRecord): BookingView {
  const items = booking.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  }));

  return {
    id: booking.id,
    reference: booking.reference,
    customerId: booking.customerId,
    customerName: booking.customerName,
    customerContact: booking.customerContact,
    customerAddress: booking.customerAddress,
    agentId: booking.agentId,
    agentName: booking.agentName,
    branchId: booking.branchId,
    branchName: booking.branchName,
    bookingDate: booking.bookingDate,
    pickupDate: booking.pickupDate,
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Number(booking.subtotal),
    discount: Number(booking.discount),
    totalAmount: Number(booking.totalAmount),
    status: booking.status,
    notes: booking.notes,
    assignedAdminId: booking.assignedAdminId,
    assignedAdminName: booking.assignedAdminName,
    assignedById: booking.assignedById,
    assignedByName: booking.assignedByName,
    assignmentDate: booking.assignmentDate,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    statusHistory: booking.statusHistory.map((entry) => ({
      id: entry.id,
      from: entry.fromStatus?.toLowerCase() ?? "",
      to: entry.toStatus.toLowerCase(),
      label: entry.label,
      timestamp: entry.createdAt,
      by: entry.byName,
    })),
  };
}

function statusLabel(status: BookingStatus): string {
  return STATUS_LABELS[status];
}

function makeReference(): string {
  const year = new Date().getUTCFullYear();
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BK-${year}-${suffix}`;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  if (
    result.getUTCHours() === 0 &&
    result.getUTCMinutes() === 0 &&
    result.getUTCSeconds() === 0 &&
    result.getUTCMilliseconds() === 0
  ) {
    result.setUTCHours(23, 59, 59, 999);
  }
  return result;
}

function normalizeItems(items: { productId: string; quantity: number }[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }
  return [...quantities.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

async function resolveBranch(
  tx: Prisma.TransactionClient,
  branchId: string,
): Promise<{ id: string; name: string }> {
  const branch = await tx.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true },
  });
  if (!branch) throw Errors.badRequest("Branch not found");
  return branch;
}

async function buildItems(
  tx: Prisma.TransactionClient,
  items: { productId: string; quantity: number }[],
) {
  const normalized = normalizeItems(items);
  const products = await tx.product.findMany({
    where: { id: { in: normalized.map((item) => item.productId) } },
    select: {
      id: true,
      name: true,
      sku: true,
      sellingPrice: true,
      status: true,
    },
  });
  const productMap = new Map(products.map((product) => [product.id, product]));

  const resolved = normalized.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) {
      throw Errors.badRequest(`Product not found: ${item.productId}`);
    }
    if (product.status === "INACTIVE") {
      throw Errors.badRequest(`Product is inactive: ${product.name}`);
    }
    const unitPrice = Number(product.sellingPrice);
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice,
      subtotal: unitPrice * item.quantity,
    };
  });

  const subtotal = resolved.reduce((sum, item) => sum + item.subtotal, 0);
  return { items: resolved, subtotal };
}

async function mustGetBooking(
  id: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<BookingRecord> {
  const booking = await tx.booking.findUnique({
    where: { id },
    include: BOOKING_INCLUDE,
  });
  if (!booking) throw Errors.notFound("Booking not found");
  return booking;
}

function assertNotTerminal(booking: BookingRecord): void {
  if (TERMINAL_STATUSES.has(booking.status)) {
    throw Errors.conflict("This booking can no longer be changed");
  }
}

async function hasCommittedStock(
  tx: Prisma.TransactionClient,
  bookingId: string,
): Promise<boolean> {
  const count = await tx.inventoryTransaction.count({
    where: {
      referenceType: "booking",
      referenceId: bookingId,
      type: "ORDER_COMMIT",
    },
  });
  return count > 0;
}

async function hasOutstandingCommittedStock(
  tx: Prisma.TransactionClient,
  bookingId: string,
): Promise<boolean> {
  const [committed, released] = await Promise.all([
    tx.inventoryTransaction.count({
      where: {
        referenceType: "booking",
        referenceId: bookingId,
        type: "ORDER_COMMIT",
      },
    }),
    tx.inventoryTransaction.count({
      where: {
        referenceType: "booking",
        referenceId: bookingId,
        type: "ORDER_RELEASE",
      },
    }),
  ]);
  return committed > released;
}

async function assertItemsEditable(
  tx: Prisma.TransactionClient,
  booking: BookingRecord,
): Promise<void> {
  if (STOCK_COMMITTED_STATUSES.has(booking.status)) {
    throw Errors.conflict(
      "Items cannot be changed after stock has been committed",
    );
  }
  if (await hasCommittedStock(tx, booking.id)) {
    throw Errors.conflict(
      "Items cannot be changed after stock has been committed",
    );
  }
}

function assertAssignedActor(
  booking: BookingRecord,
  actor: BookingActor,
): void {
  if (
    booking.assignedAdminId &&
    actor.role !== "SUPER_ADMIN" &&
    booking.assignedAdminId !== actor.id
  ) {
    throw Errors.forbidden(
      "Only the assigned admin can update this booking",
    );
  }
}

async function resolveAdmin(
  tx: Prisma.TransactionClient,
  adminId: string,
): Promise<{ id: string; name: string }> {
  const admin = await tx.user.findUnique({
    where: { id: adminId },
    select: { id: true, name: true, role: true, status: true },
  });
  if (
    !admin ||
    admin.status !== "ACTIVE" ||
    !["ADMIN", "SUPER_ADMIN"].includes(admin.role)
  ) {
    throw Errors.badRequest("Select an active admin");
  }
  return { id: admin.id, name: admin.name };
}

function actorForInventory(actor: BookingActor): InventoryActor {
  return { id: actor.id, name: actor.name };
}

function bookingItemsForStock(booking: BookingRecord) {
  return booking.items
    .filter(
      (item): item is typeof item & { productId: string } =>
        item.productId !== null,
    )
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
}

export async function listBookings(
  query: ListBookingsQueryDto,
  actor: BookingActor,
): Promise<ListBookingsResult> {
  const where: Prisma.BookingWhereInput = {};

  if (query.search) {
    where.OR = [
      { reference: { contains: query.search, mode: "insensitive" } },
      { customerName: { contains: query.search, mode: "insensitive" } },
      { agentName: { contains: query.search, mode: "insensitive" } },
      { branchName: { contains: query.search, mode: "insensitive" } },
      { assignedAdminName: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.status) where.status = query.status;
  if (query.branchId) where.branchId = query.branchId;
  if (query.agentId) where.agentId = query.agentId;
  if (query.assignedAdminId) where.assignedAdminId = query.assignedAdminId;
  if (query.assignment === "assigned") where.assignedAdminId = { not: null };
  if (query.assignment === "unassigned") where.assignedAdminId = null;
  if (query.dateFrom || query.dateTo) {
    where.bookingDate = {
      ...(query.dateFrom ? { gte: startOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: endOfDay(query.dateTo) } : {}),
    };
  }

  // Branch users only ever see their own branch. The DMS currently grants
  // this module to admins, but keeping the guard here prevents a future role
  // change from exposing cross-branch data.
  if (actor.role === "BRANCH" && actor.branchId) {
    where.branchId = actor.branchId;
  }

  const orderBy: Prisma.BookingOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: BOOKING_INCLUDE,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(toBookingView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getBookingById(id: string): Promise<BookingView> {
  return toBookingView(await mustGetBooking(id));
}

export async function createBooking(
  input: CreateBookingDto,
  actor: BookingActor,
): Promise<BookingView> {
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const branch = await resolveBranch(tx, input.branchId);
      const { items, subtotal } = await buildItems(tx, input.items);
      if (input.discount > subtotal) {
        throw Errors.badRequest("Discount cannot exceed the subtotal");
      }

      return tx.booking.create({
        data: {
          reference: makeReference(),
          customerId: input.customerId || null,
          customerName: input.customerName,
          customerContact: input.customerContact || null,
          customerAddress: input.customerAddress || null,
          agentId: input.agentId || null,
          agentName: input.agentName,
          branchId: branch.id,
          branchName: branch.name,
          bookingDate: input.bookingDate,
          pickupDate: input.pickupDate,
          subtotal,
          discount: input.discount,
          totalAmount: subtotal - input.discount,
          notes: input.notes || null,
          status: "PENDING",
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
          statusHistory: {
            create: {
              toStatus: "PENDING",
              label: "Booking created",
              byName: actor.name,
            },
          },
        },
        include: BOOKING_INCLUDE,
      });
    });

    return toBookingView(booking);
  } catch (error) {
    if (
      error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw Errors.conflict("A booking with that reference already exists");
    }
    throw error;
  }
}

export async function updateBooking(
  id: string,
  input: UpdateBookingDto,
  actor: BookingActor,
): Promise<BookingView> {
  const existing = await mustGetBooking(id);
  assertNotTerminal(existing);

  const updated = await prisma.$transaction(async (tx) => {
    const booking = await mustGetBooking(id, tx);
    assertNotTerminal(booking);

    let itemsUpdate: Prisma.BookingItemCreateWithoutBookingInput[] | undefined;
    let subtotal = Number(booking.subtotal);

    if (input.items) {
      await assertItemsEditable(tx, booking);
      const built = await buildItems(tx, input.items);
      itemsUpdate = built.items;
      subtotal = built.subtotal;
    }

    if (input.branchId && input.branchId !== booking.branchId) {
      if (
        STOCK_COMMITTED_STATUSES.has(booking.status) ||
        (await hasCommittedStock(tx, booking.id))
      ) {
        throw Errors.conflict(
          "Branch cannot be changed after stock has been committed",
        );
      }
    }

    const branch = input.branchId
      ? await resolveBranch(tx, input.branchId)
      : null;
    const nextBookingDate = input.bookingDate ?? booking.bookingDate;
    const nextPickupDate = input.pickupDate ?? booking.pickupDate;
    if (nextPickupDate < nextBookingDate) {
      throw Errors.badRequest("Pickup date cannot be before the booking date");
    }
    const discount = input.discount ?? Number(booking.discount);
    if (discount > subtotal) {
      throw Errors.badRequest("Discount cannot exceed the subtotal");
    }

    if (itemsUpdate) {
      await tx.bookingItem.deleteMany({ where: { bookingId: id } });
    }

    return tx.booking.update({
      where: { id },
      data: {
        ...(input.customerId !== undefined
          ? { customerId: input.customerId || null }
          : {}),
        ...(input.customerName !== undefined
          ? { customerName: input.customerName }
          : {}),
        ...(input.customerContact !== undefined
          ? { customerContact: input.customerContact || null }
          : {}),
        ...(input.customerAddress !== undefined
          ? { customerAddress: input.customerAddress || null }
          : {}),
        ...(input.agentId !== undefined
          ? { agentId: input.agentId || null }
          : {}),
        ...(input.agentName !== undefined ? { agentName: input.agentName } : {}),
        ...(branch ? { branchId: branch.id, branchName: branch.name } : {}),
        ...(input.bookingDate !== undefined
          ? { bookingDate: input.bookingDate }
          : {}),
        ...(input.pickupDate !== undefined
          ? { pickupDate: input.pickupDate }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        ...(itemsUpdate
          ? {
              subtotal,
              discount,
              totalAmount: subtotal - discount,
              items: { create: itemsUpdate },
            }
          : input.discount !== undefined
            ? {
                discount,
                totalAmount: subtotal - discount,
              }
            : {}),
        statusHistory: {
          create: {
            fromStatus: booking.status,
            toStatus: booking.status,
            label: "Booking details updated",
            byName: actor.name,
          },
        },
      },
      include: BOOKING_INCLUDE,
    });
  });

  return toBookingView(updated);
}

export async function deleteBooking(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await mustGetBooking(id, tx);
    if (await hasOutstandingCommittedStock(tx, booking.id)) {
      throw Errors.conflict(
        "Cancel the booking and release stock before deleting it",
      );
    }
    await tx.booking.delete({ where: { id } });
  });
}

export async function updateBookingStatus(
  id: string,
  input: UpdateBookingStatusDto,
  actor: BookingActor,
): Promise<BookingView> {
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await mustGetBooking(id, tx);
    assertAssignedActor(booking, actor);

    if (booking.status === input.status) {
      throw Errors.badRequest(
        `Booking is already ${statusLabel(input.status).toLowerCase()}`,
      );
    }
    if (input.status === "ASSIGNED") {
      throw Errors.badRequest("Use the assignment endpoint to assign a booking");
    }
    if (!ALLOWED_TRANSITIONS[booking.status].includes(input.status)) {
      throw Errors.conflict(
        `Cannot change a ${statusLabel(booking.status).toLowerCase()} booking to ${statusLabel(input.status).toLowerCase()}`,
      );
    }

    const items = bookingItemsForStock(booking);
    const inventoryActor = actorForInventory(actor);

    if (input.status === "CONFIRMED" || input.status === "COMPLETED") {
      if (items.length > 0) {
        await commitOrderStockInTransaction(
          tx,
          "booking",
          booking.id,
          { branchId: booking.branchId, items },
          inventoryActor,
        );
      }
    }

    if (input.status === "CANCELLED" || input.status === "REJECTED") {
      if (items.length > 0) {
        await releaseOrderStockInTransaction(
          tx,
          "booking",
          booking.id,
          { branchId: booking.branchId, items },
          inventoryActor,
        );
      }
    }

    return tx.booking.update({
      where: { id },
      data: {
        status: input.status,
        statusHistory: {
          create: {
            fromStatus: booking.status,
            toStatus: input.status,
            label: input.note || statusLabel(input.status),
            byName: actor.name,
          },
        },
      },
      include: BOOKING_INCLUDE,
    });
  });

  return toBookingView(updated);
}

export async function assignBooking(
  id: string,
  input: AssignBookingDto,
  actor: BookingActor,
): Promise<BookingView> {
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await mustGetBooking(id, tx);
    assertNotTerminal(booking);
    if (booking.status === "PENDING") {
      throw Errors.conflict("Booking must be accepted before it can be assigned");
    }
    const admin = await resolveAdmin(tx, input.adminId);
    const isReassign = Boolean(booking.assignedAdminId);
    const nextStatus =
      booking.status === "ACCEPTED" ? "ASSIGNED" : booking.status;

    return tx.booking.update({
      where: { id },
      data: {
        assignedAdminId: admin.id,
        assignedAdminName: admin.name,
        assignedById: actor.id,
        assignedByName: actor.name,
        assignmentDate: new Date(),
        status: nextStatus,
        statusHistory: {
          create: {
            fromStatus: booking.status,
            toStatus: nextStatus,
            label:
              input.note ||
              `${isReassign ? "Reassigned" : "Assigned"} to ${admin.name}`,
            byName: actor.name,
          },
        },
      },
      include: BOOKING_INCLUDE,
    });
  });

  return toBookingView(updated);
}

export async function unassignBooking(
  id: string,
  actor: BookingActor,
): Promise<BookingView> {
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await mustGetBooking(id, tx);
    assertNotTerminal(booking);
    if (!booking.assignedAdminId) {
      throw Errors.conflict("Booking is not assigned");
    }
    if (booking.status !== "ASSIGNED" && booking.status !== "ADMIN_ACCEPTED") {
      throw Errors.conflict(
        "Only assigned or admin-accepted bookings can be unassigned",
      );
    }
    const nextStatus = "ACCEPTED";

    return tx.booking.update({
      where: { id },
      data: {
        assignedAdminId: null,
        assignedAdminName: null,
        assignedById: null,
        assignedByName: null,
        assignmentDate: null,
        status: nextStatus,
        statusHistory: {
          create: {
            fromStatus: booking.status,
            toStatus: nextStatus,
            label: "Unassigned",
            byName: actor.name,
          },
        },
      },
      include: BOOKING_INCLUDE,
    });
  });

  return toBookingView(updated);
}

export async function applyBookingDiscount(
  id: string,
  input: ApplyBookingDiscountDto,
  actor: BookingActor,
): Promise<BookingView> {
  const updated = await prisma.$transaction(async (tx) => {
    const booking = await mustGetBooking(id, tx);
    assertNotTerminal(booking);
    const subtotal = Number(booking.subtotal);
    if (input.discount > subtotal) {
      throw Errors.badRequest("Discount cannot exceed the subtotal");
    }

    return tx.booking.update({
      where: { id },
      data: {
        discount: input.discount,
        totalAmount: subtotal - input.discount,
        statusHistory: {
          create: {
            fromStatus: booking.status,
            toStatus: booking.status,
            label:
              input.discount === 0
                ? "Discount removed"
                : input.note || `Discount applied: ${input.discount}`,
            byName: actor.name,
          },
        },
      },
      include: BOOKING_INCLUDE,
    });
  });

  return toBookingView(updated);
}
