import { randomUUID } from "node:crypto";
import type { BranchOrderStatus, Prisma, Role } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import {
  commitOrderStockInTransaction,
  releaseOrderStockInTransaction,
  type InventoryActor,
} from "../inventory/inventory.service.js";
import type {
  ApplyBranchOrderDiscountDto,
  AssignBranchOrderDto,
  CreateBranchOrderDto,
  ListBranchOrdersQueryDto,
  UpdateBranchOrderDto,
  UpdateBranchOrderStatusDto,
} from "./dto/index.js";

const BRANCH_ORDER_INCLUDE = {
  items: { orderBy: { createdAt: "asc" } },
  statusHistory: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.BranchOrderInclude;

type BranchOrderRecord = Prisma.BranchOrderGetPayload<{
  include: typeof BRANCH_ORDER_INCLUDE;
}>;

export interface BranchOrderActor {
  id: string;
  name: string;
  role?: Role;
  branchId?: string | null;
}

export interface BranchOrderItemView {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BranchOrderStatusHistoryView {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: Date;
  by: string;
}

export interface BranchOrderView {
  id: string;
  reference: string;
  branchId: string;
  branchName: string;
  branchManager: string | null;
  branchContact: string | null;
  branchAddress: string | null;
  orderDate: Date;
  items: BranchOrderItemView[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BranchOrderStatus;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignmentDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory: BranchOrderStatusHistoryView[];
}

export interface ListBranchOrdersResult {
  branchOrders: BranchOrderView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_LABELS: Record<BranchOrderStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ASSIGNED: "Assigned",
  ADMIN_ACCEPTED: "Admin accepted",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  READY_FOR_DELIVERY: "Ready for delivery",
  REJECTED: "Rejected",
};

const ALLOWED_TRANSITIONS: Record<BranchOrderStatus, BranchOrderStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["ASSIGNED", "REJECTED"],
  ASSIGNED: ["ADMIN_ACCEPTED", "REJECTED"],
  ADMIN_ACCEPTED: ["PROCESSING", "REJECTED"],
  PROCESSING: ["READY", "REJECTED"],
  READY: ["COMPLETED", "REJECTED"],
  COMPLETED: ["READY_FOR_DELIVERY"],
  READY_FOR_DELIVERY: [],
  REJECTED: [],
};

/** Statuses from which no further state change is possible. */
const TERMINAL_STATUSES = new Set<BranchOrderStatus>([
  "READY_FOR_DELIVERY",
  "REJECTED",
]);

/** Statuses whose items, branch, or dates are locked. */
const LOCKED_STATUSES = new Set<BranchOrderStatus>([
  "COMPLETED",
  "READY_FOR_DELIVERY",
  "REJECTED",
]);

const ASSIGNABLE_STATUSES = new Set<BranchOrderStatus>([
  "ACCEPTED",
  "ASSIGNED",
  "ADMIN_ACCEPTED",
  "PROCESSING",
  "READY",
]);

const DELETABLE_STATUSES = new Set<BranchOrderStatus>([
  "PENDING",
  "ACCEPTED",
  "ASSIGNED",
  "ADMIN_ACCEPTED",
  "PROCESSING",
  "READY",
  "REJECTED",
]);

function toBranchOrderView(order: BranchOrderRecord): BranchOrderView {
  const items = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
  }));

  return {
    id: order.id,
    reference: order.reference,
    branchId: order.branchId,
    branchName: order.branchName,
    branchManager: order.branchManager,
    branchContact: order.branchContact,
    branchAddress: order.branchAddress,
    orderDate: order.orderDate,
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    totalAmount: Number(order.totalAmount),
    status: order.status,
    notes: order.notes,
    assignedAdminId: order.assignedAdminId,
    assignedAdminName: order.assignedAdminName,
    assignedById: order.assignedById,
    assignedByName: order.assignedByName,
    assignmentDate: order.assignmentDate,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    statusHistory: order.statusHistory.map((entry) => ({
      id: entry.id,
      from: entry.fromStatus?.toLowerCase() ?? "",
      to: entry.toStatus.toLowerCase(),
      label: entry.label,
      timestamp: entry.createdAt,
      by: entry.byName,
    })),
  };
}

function statusLabel(status: BranchOrderStatus): string {
  return STATUS_LABELS[status];
}

function makeReference(): string {
  const year = new Date().getUTCFullYear();
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BO-${year}-${suffix}`;
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

interface BranchSnapshot {
  id: string;
  name: string;
  manager: string | null;
  contact: string | null;
  address: string | null;
}

async function resolveBranch(
  tx: Prisma.TransactionClient,
  branchId: string,
): Promise<BranchSnapshot> {
  const branch = await tx.branch.findUnique({
    where: { id: branchId },
    select: { id: true, name: true },
  });
  if (!branch) throw Errors.badRequest("Branch not found");

  const branchUser = await tx.user.findFirst({
    where: { branchId: branch.id, role: "BRANCH" },
    select: { name: true, contactNumber: true, address: true },
  });

  return {
    id: branch.id,
    name: branch.name,
    manager: branchUser?.name ?? null,
    contact: branchUser?.contactNumber ?? null,
    address: branchUser?.address ?? null,
  };
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

async function mustGetBranchOrder(
  id: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<BranchOrderRecord> {
  const order = await tx.branchOrder.findUnique({
    where: { id },
    include: BRANCH_ORDER_INCLUDE,
  });
  if (!order) throw Errors.notFound("Branch order not found");
  return order;
}

function assertBranchAccess(
  order: BranchOrderRecord,
  actor: BranchOrderActor,
): void {
  if (actor.role === "BRANCH" && order.branchId !== actor.branchId) {
    throw Errors.forbidden("You can only access your own branch orders");
  }
}

function assertNotTerminal(order: BranchOrderRecord): void {
  if (TERMINAL_STATUSES.has(order.status)) {
    throw Errors.conflict("This branch order can no longer be changed");
  }
}

function assertNotLocked(order: BranchOrderRecord): void {
  if (LOCKED_STATUSES.has(order.status)) {
    throw Errors.conflict("This branch order can no longer be edited");
  }
}

async function hasCommittedStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<boolean> {
  const count = await tx.inventoryTransaction.count({
    where: {
      referenceType: "branch_order",
      referenceId: orderId,
      type: "ORDER_COMMIT",
    },
  });
  return count > 0;
}

async function hasOutstandingCommittedStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<boolean> {
  const [committed, released] = await Promise.all([
    tx.inventoryTransaction.count({
      where: {
        referenceType: "branch_order",
        referenceId: orderId,
        type: "ORDER_COMMIT",
      },
    }),
    tx.inventoryTransaction.count({
      where: {
        referenceType: "branch_order",
        referenceId: orderId,
        type: "ORDER_RELEASE",
      },
    }),
  ]);
  return committed > released;
}

async function assertItemsEditable(
  tx: Prisma.TransactionClient,
  order: BranchOrderRecord,
): Promise<void> {
  if (order.status === "COMPLETED" || order.status === "READY_FOR_DELIVERY") {
    throw Errors.conflict(
      "Items cannot be changed after stock has been committed",
    );
  }
  if (await hasCommittedStock(tx, order.id)) {
    throw Errors.conflict(
      "Items cannot be changed after stock has been committed",
    );
  }
}

function assertAssignedActor(
  order: BranchOrderRecord,
  actor: BranchOrderActor,
): void {
  if (
    order.assignedAdminId &&
    actor.role !== "SUPER_ADMIN" &&
    order.assignedAdminId !== actor.id
  ) {
    throw Errors.forbidden(
      "Only the assigned admin can update this branch order",
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

function actorForInventory(actor: BranchOrderActor): InventoryActor {
  return { id: actor.id, name: actor.name };
}

function itemsForStock(order: BranchOrderRecord) {
  return order.items
    .filter(
      (item): item is typeof item & { productId: string } =>
        item.productId !== null,
    )
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
}

function resolveCreateBranchId(
  input: CreateBranchOrderDto,
  actor: BranchOrderActor,
): string {
  if (actor.role === "BRANCH") {
    if (!actor.branchId) {
      throw Errors.forbidden("No branch is linked to this account");
    }
    if (input.branchId && input.branchId !== actor.branchId) {
      throw Errors.forbidden("You can only create orders for your own branch");
    }
    return actor.branchId;
  }

  if (!input.branchId) {
    throw Errors.badRequest("Branch is required");
  }
  return input.branchId;
}

export async function listBranchOrders(
  query: ListBranchOrdersQueryDto,
  actor: BranchOrderActor,
): Promise<ListBranchOrdersResult> {
  const where: Prisma.BranchOrderWhereInput = {};

  if (query.search) {
    where.OR = [
      { reference: { contains: query.search, mode: "insensitive" } },
      { branchName: { contains: query.search, mode: "insensitive" } },
      { branchManager: { contains: query.search, mode: "insensitive" } },
      { assignedAdminName: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.status) where.status = query.status;
  if (query.branchId) where.branchId = query.branchId;
  if (query.assignedAdminId) where.assignedAdminId = query.assignedAdminId;
  if (query.assignment === "assigned") where.assignedAdminId = { not: null };
  if (query.assignment === "unassigned") where.assignedAdminId = null;
  if (query.dateFrom || query.dateTo) {
    where.orderDate = {
      ...(query.dateFrom ? { gte: startOfDay(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: endOfDay(query.dateTo) } : {}),
    };
  }

  if (actor.role === "BRANCH") {
    if (!actor.branchId) {
      throw Errors.forbidden("No branch is linked to this account");
    }
    where.branchId = actor.branchId;
  }

  const orderBy: Prisma.BranchOrderOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const [branchOrders, total] = await Promise.all([
    prisma.branchOrder.findMany({
      where,
      include: BRANCH_ORDER_INCLUDE,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.branchOrder.count({ where }),
  ]);

  return {
    branchOrders: branchOrders.map(toBranchOrderView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getBranchOrderById(
  id: string,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const order = await mustGetBranchOrder(id);
  assertBranchAccess(order, actor);
  return toBranchOrderView(order);
}

export async function createBranchOrder(
  input: CreateBranchOrderDto,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const branchId = resolveCreateBranchId(input, actor);

  try {
    const order = await prisma.$transaction(async (tx) => {
      const branch = await resolveBranch(tx, branchId);
      const { items, subtotal } = await buildItems(tx, input.items);
      if (input.discount > subtotal) {
        throw Errors.badRequest("Discount cannot exceed the subtotal");
      }

      return tx.branchOrder.create({
        data: {
          reference: makeReference(),
          branchId: branch.id,
          branchName: branch.name,
          branchManager: branch.manager,
          branchContact: branch.contact,
          branchAddress: branch.address,
          orderDate: input.orderDate ?? new Date(),
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
              label: "Branch order created",
              byName: actor.name,
            },
          },
        },
        include: BRANCH_ORDER_INCLUDE,
      });
    });

    return toBranchOrderView(order);
  } catch (error) {
    if (
      error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw Errors.conflict(
        "A branch order with that reference already exists",
      );
    }
    throw error;
  }
}

export async function updateBranchOrder(
  id: string,
  input: UpdateBranchOrderDto,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const existing = await mustGetBranchOrder(id);
  assertBranchAccess(existing, actor);
  assertNotTerminal(existing);
  assertNotLocked(existing);

  const updated = await prisma.$transaction(async (tx) => {
    const order = await mustGetBranchOrder(id, tx);
    assertNotTerminal(order);
    assertNotLocked(order);

    let itemsUpdate:
      | Prisma.BranchOrderItemCreateWithoutBranchOrderInput[]
      | undefined;
    let subtotal = Number(order.subtotal);

    if (input.items) {
      await assertItemsEditable(tx, order);
      const built = await buildItems(tx, input.items);
      itemsUpdate = built.items;
      subtotal = built.subtotal;
    }

    if (input.branchId && input.branchId !== order.branchId) {
      if (actor.role === "BRANCH") {
        throw Errors.forbidden("You can only update your own branch orders");
      }
      if (await hasCommittedStock(tx, order.id)) {
        throw Errors.conflict(
          "Branch cannot be changed after stock has been committed",
        );
      }
    }

    const branch = input.branchId
      ? await resolveBranch(tx, input.branchId)
      : null;
    const discount = input.discount ?? Number(order.discount);
    if (discount > subtotal) {
      throw Errors.badRequest("Discount cannot exceed the subtotal");
    }

    if (itemsUpdate) {
      await tx.branchOrderItem.deleteMany({ where: { branchOrderId: id } });
    }

    return tx.branchOrder.update({
      where: { id },
      data: {
        ...(branch
          ? {
              branchId: branch.id,
              branchName: branch.name,
              branchManager: branch.manager,
              branchContact: branch.contact,
              branchAddress: branch.address,
            }
          : {}),
        ...(input.orderDate !== undefined
          ? { orderDate: input.orderDate }
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
            fromStatus: order.status,
            toStatus: order.status,
            label: "Branch order details updated",
            byName: actor.name,
          },
        },
      },
      include: BRANCH_ORDER_INCLUDE,
    });
  });

  return toBranchOrderView(updated);
}

export async function deleteBranchOrder(
  id: string,
  actor: BranchOrderActor,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await mustGetBranchOrder(id, tx);
    assertBranchAccess(order, actor);

    if (!DELETABLE_STATUSES.has(order.status)) {
      throw Errors.conflict(
        "Completed branch orders cannot be deleted",
      );
    }
    if (await hasOutstandingCommittedStock(tx, order.id)) {
      throw Errors.conflict(
        "Reject the branch order and release stock before deleting it",
      );
    }
    await tx.branchOrder.delete({ where: { id } });
  });
}

export async function updateBranchOrderStatus(
  id: string,
  input: UpdateBranchOrderStatusDto,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await mustGetBranchOrder(id, tx);
    assertBranchAccess(order, actor);
    assertAssignedActor(order, actor);

    if (order.status === input.status) {
      throw Errors.badRequest(
        `Branch order is already ${statusLabel(input.status).toLowerCase()}`,
      );
    }
    if (input.status === "ASSIGNED") {
      throw Errors.badRequest(
        "Use the assignment endpoint to assign a branch order",
      );
    }
    if (!ALLOWED_TRANSITIONS[order.status].includes(input.status)) {
      throw Errors.conflict(
        `Cannot change a ${statusLabel(order.status).toLowerCase()} branch order to ${statusLabel(input.status).toLowerCase()}`,
      );
    }

    const items = itemsForStock(order);
    const inventoryActor = actorForInventory(actor);

    if (input.status === "COMPLETED" && items.length > 0) {
      await commitOrderStockInTransaction(
        tx,
        "branch_order",
        order.id,
        { branchId: order.branchId, items },
        inventoryActor,
      );
    }

    if (input.status === "REJECTED" && items.length > 0) {
      await releaseOrderStockInTransaction(
        tx,
        "branch_order",
        order.id,
        { branchId: order.branchId, items },
        inventoryActor,
      );
    }

    return tx.branchOrder.update({
      where: { id },
      data: {
        status: input.status,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: input.status,
            label: input.note || statusLabel(input.status),
            byName: actor.name,
          },
        },
      },
      include: BRANCH_ORDER_INCLUDE,
    });
  });

  return toBranchOrderView(updated);
}

export async function assignBranchOrder(
  id: string,
  input: AssignBranchOrderDto,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await mustGetBranchOrder(id, tx);
    assertBranchAccess(order, actor);
    assertNotTerminal(order);

    if (!ASSIGNABLE_STATUSES.has(order.status)) {
      throw Errors.conflict(
        "Branch order must be accepted before it can be assigned",
      );
    }

    const admin = await resolveAdmin(tx, input.adminId);
    const isReassign = Boolean(order.assignedAdminId);
    const nextStatus =
      order.status === "ACCEPTED" ? "ASSIGNED" : order.status;

    return tx.branchOrder.update({
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
            fromStatus: order.status,
            toStatus: nextStatus,
            label:
              input.note ||
              `${isReassign ? "Reassigned" : "Assigned"} to ${admin.name}`,
            byName: actor.name,
          },
        },
      },
      include: BRANCH_ORDER_INCLUDE,
    });
  });

  return toBranchOrderView(updated);
}

export async function unassignBranchOrder(
  id: string,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await mustGetBranchOrder(id, tx);
    assertBranchAccess(order, actor);
    assertNotTerminal(order);

    if (!order.assignedAdminId) {
      throw Errors.conflict("Branch order is not assigned");
    }
    if (order.status !== "ASSIGNED" && order.status !== "ADMIN_ACCEPTED") {
      throw Errors.conflict(
        "Only assigned or admin-accepted branch orders can be unassigned",
      );
    }

    return tx.branchOrder.update({
      where: { id },
      data: {
        assignedAdminId: null,
        assignedAdminName: null,
        assignedById: null,
        assignedByName: null,
        assignmentDate: null,
        status: "ACCEPTED",
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: "ACCEPTED",
            label: "Unassigned",
            byName: actor.name,
          },
        },
      },
      include: BRANCH_ORDER_INCLUDE,
    });
  });

  return toBranchOrderView(updated);
}

export async function applyBranchOrderDiscount(
  id: string,
  input: ApplyBranchOrderDiscountDto,
  actor: BranchOrderActor,
): Promise<BranchOrderView> {
  const updated = await prisma.$transaction(async (tx) => {
    const order = await mustGetBranchOrder(id, tx);
    assertBranchAccess(order, actor);
    assertNotTerminal(order);

    const subtotal = Number(order.subtotal);
    if (input.discount > subtotal) {
      throw Errors.badRequest("Discount cannot exceed the subtotal");
    }

    return tx.branchOrder.update({
      where: { id },
      data: {
        discount: input.discount,
        totalAmount: subtotal - input.discount,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: order.status,
            label:
              input.discount === 0
                ? "Discount removed"
                : input.note || `Discount applied: ${input.discount}`,
            byName: actor.name,
          },
        },
      },
      include: BRANCH_ORDER_INCLUDE,
    });
  });

  return toBranchOrderView(updated);
}
