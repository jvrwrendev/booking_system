import type {
  InventoryTransactionType,
  Prisma,
  StockStatus,
} from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import { computeStockStatus, deriveProductStatus } from "../../lib/stock.js";
import type {
  InventoryAlertsQueryDto,
  InventoryListQueryDto,
  InventorySummaryQueryDto,
  OrderStockItemsDto,
  StockAdjustmentDto,
  StockInDto,
  StockOutDto,
  StockTransferDto,
  TransactionListQueryDto,
} from "./dto/index.js";

export interface InventoryActor {
  id: string;
  name: string;
}

const INVENTORY_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      sku: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      minimumStockLevel: true,
      status: true,
    },
  },
  branch: { select: { id: true, name: true } },
} satisfies Prisma.InventoryStockInclude;

type InventoryRowRecord = Prisma.InventoryStockGetPayload<{
  include: typeof INVENTORY_INCLUDE;
}>;

const TRANSACTION_INCLUDE = {
  product: { select: { id: true, name: true, sku: true } },
  branch: { select: { id: true, name: true } },
} satisfies Prisma.InventoryTransactionInclude;

type TransactionRecord = Prisma.InventoryTransactionGetPayload<{
  include: typeof TRANSACTION_INCLUDE;
}>;

export interface InventoryItemView {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  branchId: string;
  branchName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  status: StockStatus;
  updatedAt: Date;
}

export interface InventoryTransactionView {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  branchName: string;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  referenceType: string | null;
  referenceId: string | null;
  date: Date;
}

export interface ListInventoryResult {
  items: InventoryItemView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListTransactionsResult {
  transactions: InventoryTransactionView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  criticalCount: number;
  outOfStockCount: number;
  alerts: InventoryItemView[];
}

function toInventoryItem(row: InventoryRowRecord): InventoryItemView {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product.name,
    sku: row.product.sku,
    categoryId: row.product.categoryId,
    categoryName: row.product.category?.name ?? "Uncategorized",
    branchId: row.branchId,
    branchName: row.branch.name,
    currentStock: row.currentStock,
    reservedStock: row.reservedStock,
    availableStock: Math.max(0, row.currentStock - row.reservedStock),
    minimumStock: row.minimumStock,
    status: row.status,
    updatedAt: row.updatedAt,
  };
}

function toTransaction(row: TransactionRecord): InventoryTransactionView {
  return {
    id: row.id,
    productId: row.productId,
    productName: row.product.name,
    sku: row.product.sku,
    branchId: row.branchId,
    branchName: row.branch.name,
    type: row.type,
    quantity: row.quantity,
    previousStock: row.previousStock,
    newStock: row.newStock,
    reason: row.reason,
    performedBy: row.performedByName,
    referenceType: row.referenceType,
    referenceId: row.referenceId,
    date: row.createdAt,
  };
}

export async function resolveBranchId(
  tx: Prisma.TransactionClient,
  branchId?: string,
): Promise<string> {
  if (branchId) {
    const branch = await tx.branch.findUnique({
      where: { id: branchId },
      select: { id: true },
    });
    if (!branch) throw Errors.notFound("Branch not found");
    return branch.id;
  }

  const branch = await tx.branch.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!branch) {
    throw Errors.badRequest(
      "No active branch is configured. Add a branch before managing stock.",
    );
  }

  return branch.id;
}

export async function ensureStockRow(
  tx: Prisma.TransactionClient,
  productId: string,
  branchId: string,
  minimumStock: number,
): Promise<Prisma.InventoryStockGetPayload<Record<string, never>>> {
  return tx.inventoryStock.upsert({
    where: { productId_branchId: { productId, branchId } },
    update: {},
    create: {
      productId,
      branchId,
      currentStock: 0,
      minimumStock,
      status: "OUT_OF_STOCK",
    },
  });
}

async function refreshStockRowStatus(
  tx: Prisma.TransactionClient,
  rowId: string,
  currentStock: number,
  minimumStock: number,
): Promise<void> {
  await tx.inventoryStock.update({
    where: { id: rowId },
    data: { status: computeStockStatus(currentStock, minimumStock) },
  });
}

export async function refreshProductTotals(
  tx: Prisma.TransactionClient,
  productId: string,
): Promise<void> {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, minimumStockLevel: true },
  });
  if (!product) return;

  const aggregate = await tx.inventoryStock.aggregate({
    where: { productId },
    _sum: { currentStock: true },
  });

  const total = aggregate._sum.currentStock ?? 0;

  await tx.product.update({
    where: { id: productId },
    data: {
      stockQuantity: total,
      stockStatus: computeStockStatus(total, product.minimumStockLevel),
      status: deriveProductStatus(product.status, total),
    },
  });
}

async function recordTransaction(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    branchId: string;
    type: InventoryTransactionType;
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    actor: InventoryActor;
    referenceType?: string;
    referenceId?: string;
  },
): Promise<TransactionRecord> {
  return tx.inventoryTransaction.create({
    data: {
      productId: input.productId,
      branchId: input.branchId,
      type: input.type,
      quantity: input.quantity,
      previousStock: input.previousStock,
      newStock: input.newStock,
      reason: input.reason,
      performedById: input.actor.id,
      performedByName: input.actor.name,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    },
    include: TRANSACTION_INCLUDE,
  });
}

async function mustGetProduct(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, minimumStockLevel: true },
  });
  if (!product) throw Errors.notFound("Product not found");
  return product;
}

async function incrementStock(
  tx: Prisma.TransactionClient,
  rowId: string,
  quantity: number,
) {
  const updated = await tx.inventoryStock.update({
    where: { id: rowId },
    data: { currentStock: { increment: quantity } },
  });
  await refreshStockRowStatus(
    tx,
    updated.id,
    updated.currentStock,
    updated.minimumStock,
  );
  return updated;
}

async function decrementStock(
  tx: Prisma.TransactionClient,
  rowId: string,
  quantity: number,
  productName: string,
) {
  const result = await tx.inventoryStock.updateMany({
    where: { id: rowId, currentStock: { gte: quantity } },
    data: { currentStock: { decrement: quantity } },
  });

  if (result.count === 0) {
    const row = await tx.inventoryStock.findUnique({
      where: { id: rowId },
      select: { currentStock: true },
    });
    throw Errors.conflict(
      `Insufficient stock for ${productName}. Available: ${row?.currentStock ?? 0}, requested: ${quantity}.`,
    );
  }

  const updated = await tx.inventoryStock.findUniqueOrThrow({
    where: { id: rowId },
  });
  await refreshStockRowStatus(
    tx,
    updated.id,
    updated.currentStock,
    updated.minimumStock,
  );
  return updated;
}

export async function listInventory(
  query: InventoryListQueryDto,
): Promise<ListInventoryResult> {
  const productWhere: Prisma.ProductWhereInput = {};

  if (query.search) {
    productWhere.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
      { brand: { contains: query.search, mode: "insensitive" } },
      { category: { name: { contains: query.search, mode: "insensitive" } } },
      { inventory: { some: { branch: { name: { contains: query.search, mode: "insensitive" } } } } },
    ];
  }
  if (query.productId) productWhere.id = query.productId;
  if (query.categoryId) productWhere.categoryId = query.categoryId;

  const where: Prisma.InventoryStockWhereInput = {
    product: productWhere,
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  let orderBy: Prisma.InventoryStockOrderByWithRelationInput;
  if (query.sortBy === "productName") {
    orderBy = { product: { name: query.sortOrder } };
  } else if (query.sortBy === "currentStock") {
    orderBy = { currentStock: query.sortOrder };
  } else {
    orderBy = { updatedAt: query.sortOrder };
  }

  const [items, total] = await Promise.all([
    prisma.inventoryStock.findMany({
      where,
      include: INVENTORY_INCLUDE,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.inventoryStock.count({ where }),
  ]);

  return {
    items: items.map(toInventoryItem),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function listBranches() {
  return prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, status: true },
  });
}

export async function listAlerts(
  query: InventoryAlertsQueryDto,
): Promise<InventoryItemView[]> {
  const severity: Record<string, number> = {
    OUT_OF_STOCK: 0,
    CRITICAL: 1,
    LOW_STOCK: 2,
    IN_STOCK: 3,
  };

  if (query.branchId) {
    const rows = await prisma.inventoryStock.findMany({
      where: {
        branchId: query.branchId,
        product: { status: { not: "INACTIVE" } },
        status: { in: ["LOW_STOCK", "CRITICAL", "OUT_OF_STOCK"] },
      },
      include: INVENTORY_INCLUDE,
    });

    return rows
      .sort(
        (a, b) =>
          (severity[a.status] ?? 9) - (severity[b.status] ?? 9) ||
          a.currentStock - b.currentStock ||
          a.product.name.localeCompare(b.product.name),
      )
      .slice(0, query.limit)
      .map(toInventoryItem);
  }

  // Without a branch filter, an alert is a product-level concern. Report the
  // product's total stock and use its largest branch holding for context.
  const products = await prisma.product.findMany({
    where: {
      status: { not: "INACTIVE" },
      stockStatus: { in: ["LOW_STOCK", "CRITICAL", "OUT_OF_STOCK"] },
    },
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      minimumStockLevel: true,
      stockStatus: true,
    },
  });

  if (products.length === 0) return [];

  const rows = await prisma.inventoryStock.findMany({
    where: { productId: { in: products.map((product) => product.id) } },
    include: INVENTORY_INCLUDE,
  });

  const largestRow = new Map<string, InventoryRowRecord>();
  for (const row of rows) {
    const current = largestRow.get(row.productId);
    if (!current || row.currentStock > current.currentStock) {
      largestRow.set(row.productId, row);
    }
  }

  return products
    .sort(
      (a, b) =>
        (severity[a.stockStatus] ?? 9) - (severity[b.stockStatus] ?? 9) ||
        a.stockQuantity - b.stockQuantity ||
        a.name.localeCompare(b.name),
    )
    .slice(0, query.limit)
    .flatMap((product) => {
      const row = largestRow.get(product.id);
      if (!row) return [];
      const item = toInventoryItem(row);
      return [
        {
          ...item,
          currentStock: product.stockQuantity,
          availableStock: product.stockQuantity,
          minimumStock: product.minimumStockLevel,
          status: product.stockStatus,
        },
      ];
    });
}

export async function getInventorySummary(
  query: InventorySummaryQueryDto,
): Promise<InventorySummary> {
  const branchId = query.branchId;

  if (branchId) {
    const rows = await prisma.inventoryStock.findMany({
      where: { branchId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            costPrice: true,
            status: true,
          },
        },
        branch: { select: { id: true, name: true } },
      },
    });

    let totalUnits = 0;
    let inventoryValue = 0;
    const statusCounts: Record<string, number> = {
      LOW_STOCK: 0,
      CRITICAL: 0,
      OUT_OF_STOCK: 0,
    };

    for (const row of rows) {
      totalUnits += row.currentStock;
      inventoryValue += row.currentStock * Number(row.product.costPrice);
      if (row.product.status !== "INACTIVE") {
        statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
      }
    }

    const productIds = new Set(rows.map((row) => row.productId));
    const alerts = await listAlerts({ branchId, limit: 10 });

    return {
      totalProducts: productIds.size,
      totalUnits,
      inventoryValue: Number(inventoryValue.toFixed(2)),
      lowStockCount: statusCounts.LOW_STOCK ?? 0,
      criticalCount: statusCounts.CRITICAL ?? 0,
      outOfStockCount: statusCounts.OUT_OF_STOCK ?? 0,
      alerts,
    };
  }

  const products = await prisma.product.findMany({
    select: {
      id: true,
      stockQuantity: true,
      minimumStockLevel: true,
      costPrice: true,
      status: true,
      stockStatus: true,
    },
  });

  let totalUnits = 0;
  let inventoryValue = 0;
  const statusCounts: Record<string, number> = {
    LOW_STOCK: 0,
    CRITICAL: 0,
    OUT_OF_STOCK: 0,
  };

  for (const product of products) {
    totalUnits += product.stockQuantity;
    inventoryValue += product.stockQuantity * Number(product.costPrice);
    if (product.status !== "INACTIVE") {
      statusCounts[product.stockStatus] =
        (statusCounts[product.stockStatus] ?? 0) + 1;
    }
  }

  const alerts = await listAlerts({ limit: 10 });

  return {
    totalProducts: products.length,
    totalUnits,
    inventoryValue: Number(inventoryValue.toFixed(2)),
    lowStockCount: statusCounts.LOW_STOCK ?? 0,
    criticalCount: statusCounts.CRITICAL ?? 0,
    outOfStockCount: statusCounts.OUT_OF_STOCK ?? 0,
    alerts,
  };
}

export async function listTransactions(
  query: TransactionListQueryDto,
): Promise<ListTransactionsResult> {
  const where: Prisma.InventoryTransactionWhereInput = {};

  if (query.search) {
    where.OR = [
      { product: { name: { contains: query.search, mode: "insensitive" } } },
      { product: { sku: { contains: query.search, mode: "insensitive" } } },
      { branch: { name: { contains: query.search, mode: "insensitive" } } },
      { reason: { contains: query.search, mode: "insensitive" } },
      { performedByName: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.productId) where.productId = query.productId;
  if (query.branchId) where.branchId = query.branchId;
  if (query.type) where.type = query.type;
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.inventoryTransaction.findMany({
      where,
      include: TRANSACTION_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.inventoryTransaction.count({ where }),
  ]);

  return {
    transactions: transactions.map(toTransaction),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function stockIn(
  input: StockInDto,
  actor: InventoryActor,
): Promise<{ item: InventoryItemView; transaction: InventoryTransactionView }> {
  return prisma.$transaction(async (tx) => {
    const product = await mustGetProduct(tx, input.productId);
    const branchId = await resolveBranchId(tx, input.branchId);
    const row = await ensureStockRow(
      tx,
      product.id,
      branchId,
      product.minimumStockLevel,
    );
    const updated = await incrementStock(tx, row.id, input.quantity);
    await refreshProductTotals(tx, product.id);

    const transaction = await recordTransaction(tx, {
      productId: product.id,
      branchId,
      type: "STOCK_IN",
      quantity: input.quantity,
      previousStock: updated.currentStock - input.quantity,
      newStock: updated.currentStock,
      reason: input.reason || "Stock in",
      actor,
    });

    const item = await tx.inventoryStock.findUniqueOrThrow({
      where: { id: updated.id },
      include: INVENTORY_INCLUDE,
    });

    return { item: toInventoryItem(item), transaction: toTransaction(transaction) };
  });
}

export async function stockOut(
  input: StockOutDto,
  actor: InventoryActor,
): Promise<{ item: InventoryItemView; transaction: InventoryTransactionView }> {
  return prisma.$transaction(async (tx) => {
    const product = await mustGetProduct(tx, input.productId);
    const branchId = await resolveBranchId(tx, input.branchId);
    const row = await ensureStockRow(
      tx,
      product.id,
      branchId,
      product.minimumStockLevel,
    );
    const updated = await decrementStock(
      tx,
      row.id,
      input.quantity,
      product.name,
    );
    await refreshProductTotals(tx, product.id);

    const transaction = await recordTransaction(tx, {
      productId: product.id,
      branchId,
      type: "STOCK_OUT",
      quantity: -input.quantity,
      previousStock: updated.currentStock + input.quantity,
      newStock: updated.currentStock,
      reason: input.reason || "Stock out",
      actor,
    });

    const item = await tx.inventoryStock.findUniqueOrThrow({
      where: { id: updated.id },
      include: INVENTORY_INCLUDE,
    });

    return { item: toInventoryItem(item), transaction: toTransaction(transaction) };
  });
}

export async function adjustStock(
  input: StockAdjustmentDto,
  actor: InventoryActor,
): Promise<{ item: InventoryItemView; transaction: InventoryTransactionView }> {
  return prisma.$transaction(async (tx) => {
    const product = await mustGetProduct(tx, input.productId);
    const branchId = await resolveBranchId(tx, input.branchId);
    const row = await ensureStockRow(
      tx,
      product.id,
      branchId,
      product.minimumStockLevel,
    );

    const updated =
      input.quantity > 0
        ? await incrementStock(tx, row.id, input.quantity)
        : await decrementStock(tx, row.id, Math.abs(input.quantity), product.name);

    await refreshProductTotals(tx, product.id);

    const transaction = await recordTransaction(tx, {
      productId: product.id,
      branchId,
      type: "ADJUSTMENT",
      quantity: input.quantity,
      previousStock: updated.currentStock - input.quantity,
      newStock: updated.currentStock,
      reason: input.reason,
      actor,
    });

    const item = await tx.inventoryStock.findUniqueOrThrow({
      where: { id: updated.id },
      include: INVENTORY_INCLUDE,
    });

    return { item: toInventoryItem(item), transaction: toTransaction(transaction) };
  });
}

export async function transferStock(
  input: StockTransferDto,
  actor: InventoryActor,
): Promise<{ item: InventoryItemView; transaction: InventoryTransactionView }> {
  return prisma.$transaction(async (tx) => {
    const product = await mustGetProduct(tx, input.productId);

    const fromBranch = await tx.branch.findUnique({
      where: { id: input.fromBranchId },
      select: { id: true, name: true },
    });
    if (!fromBranch) throw Errors.notFound("Source branch not found");

    const toBranch = await tx.branch.findUnique({
      where: { id: input.toBranchId },
      select: { id: true, name: true },
    });
    if (!toBranch) throw Errors.notFound("Destination branch not found");

    const fromRow = await ensureStockRow(
      tx,
      product.id,
      fromBranch.id,
      product.minimumStockLevel,
    );
    const toRow = await ensureStockRow(
      tx,
      product.id,
      toBranch.id,
      product.minimumStockLevel,
    );

    const fromUpdated = await decrementStock(
      tx,
      fromRow.id,
      input.quantity,
      product.name,
    );
    const toUpdated = await incrementStock(tx, toRow.id, input.quantity);
    await refreshProductTotals(tx, product.id);

    const reason = input.reason || `Transfer ${fromBranch.name} → ${toBranch.name}`;

    await recordTransaction(tx, {
      productId: product.id,
      branchId: fromBranch.id,
      type: "TRANSFER",
      quantity: -input.quantity,
      previousStock: fromUpdated.currentStock + input.quantity,
      newStock: fromUpdated.currentStock,
      reason,
      actor,
    });

    const transaction = await recordTransaction(tx, {
      productId: product.id,
      branchId: toBranch.id,
      type: "TRANSFER",
      quantity: input.quantity,
      previousStock: toUpdated.currentStock - input.quantity,
      newStock: toUpdated.currentStock,
      reason,
      actor,
    });

    const item = await tx.inventoryStock.findUniqueOrThrow({
      where: { id: toUpdated.id },
      include: INVENTORY_INCLUDE,
    });

    return { item: toInventoryItem(item), transaction: toTransaction(transaction) };
  });
}

interface ResolvedOrderItem {
  productId: string;
  quantity: number;
}

async function resolveOrderItems(
  tx: Prisma.TransactionClient,
  input: OrderStockItemsDto,
): Promise<{ items: ResolvedOrderItem[]; skipped: number }> {
  const quantities = new Map<string, number>();
  let skipped = 0;

  for (const item of input.items) {
    let product:
      | { id: string }
      | null = null;

    if (item.productId) {
      product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { id: true },
      });
      if (!product) {
        throw Errors.notFound(`Product not found: ${item.productName ?? item.productId}`);
      }
    } else if (item.sku) {
      product = await tx.product.findFirst({
        where: { sku: { equals: item.sku, mode: "insensitive" } },
        select: { id: true },
      });
    } else if (item.productName) {
      product = await tx.product.findFirst({
        where: { name: { equals: item.productName, mode: "insensitive" } },
        select: { id: true },
      });
    }

    if (!product) {
      // Branch orders may contain free-text items that are not catalog
      // products. They carry no inventory and are intentionally skipped.
      skipped += 1;
      continue;
    }

    quantities.set(
      product.id,
      (quantities.get(product.id) ?? 0) + item.quantity,
    );
  }

  return {
    items: [...quantities.entries()].map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
    skipped,
  };
}

export async function commitOrderStock(
  referenceType: string,
  referenceId: string,
  input: OrderStockItemsDto,
  actor: InventoryActor,
): Promise<{ committed: number; skipped: number }> {
  try {
    return await prisma.$transaction(async (tx) => {
    const branchId = await resolveBranchId(tx, input.branchId);
    const { items, skipped } = await resolveOrderItems(tx, input);

    if (items.length === 0) {
      return { committed: 0, skipped };
    }

    const existing = await tx.inventoryTransaction.findMany({
      where: {
        referenceType,
        referenceId,
        type: "ORDER_COMMIT",
        productId: { in: items.map((item) => item.productId) },
      },
      select: { productId: true },
    });
    const committedProducts = new Set(existing.map((row) => row.productId));

    let committed = 0;

    for (const item of items) {
      if (committedProducts.has(item.productId)) {
        continue;
      }

      const product = await mustGetProduct(tx, item.productId);
      const row = await ensureStockRow(
        tx,
        product.id,
        branchId,
        product.minimumStockLevel,
      );
      const updated = await decrementStock(
        tx,
        row.id,
        item.quantity,
        product.name,
      );

      await recordTransaction(tx, {
        productId: product.id,
        branchId,
        type: "ORDER_COMMIT",
        quantity: -item.quantity,
        previousStock: updated.currentStock + item.quantity,
        newStock: updated.currentStock,
        reason: `Stock committed for ${referenceType.replace("_", " ")} ${referenceId}`,
        actor,
        referenceType,
        referenceId,
      });

      committed += 1;
    }

    if (committed > 0) {
      for (const item of items) {
        await refreshProductTotals(tx, item.productId);
      }
    }

      return { committed, skipped };
    });
  } catch (error) {
    if (isUniqueTransactionError(error)) {
      // A concurrent confirmation already committed this order. The unique
      // reference key makes the duplicate a successful no-op.
      return { committed: 0, skipped: 0 };
    }
    throw error;
  }
}

export async function releaseOrderStock(
  referenceType: string,
  referenceId: string,
  input: OrderStockItemsDto,
  actor: InventoryActor,
): Promise<{ released: number; skipped: number }> {
  try {
    return await prisma.$transaction(async (tx) => {
    const { items, skipped } = await resolveOrderItems(tx, input);

    const committed = await tx.inventoryTransaction.findMany({
      where: {
        referenceType,
        referenceId,
        type: "ORDER_COMMIT",
        ...(items.length > 0
          ? { productId: { in: items.map((item) => item.productId) } }
          : {}),
      },
      select: { productId: true, quantity: true, branchId: true },
    });

    if (committed.length === 0) {
      return { released: 0, skipped };
    }

    const releasedRows = await tx.inventoryTransaction.findMany({
      where: {
        referenceType,
        referenceId,
        type: "ORDER_RELEASE",
        productId: { in: committed.map((row) => row.productId) },
      },
      select: { productId: true },
    });
    const releasedProducts = new Set(releasedRows.map((row) => row.productId));

    let released = 0;

    for (const row of committed) {
      if (releasedProducts.has(row.productId)) continue;

      const quantity = Math.abs(row.quantity);
      const product = await mustGetProduct(tx, row.productId);
      const stockRow = await ensureStockRow(
        tx,
        product.id,
        row.branchId,
        product.minimumStockLevel,
      );
      const updated = await incrementStock(tx, stockRow.id, quantity);

      await recordTransaction(tx, {
        productId: product.id,
        branchId: row.branchId,
        type: "ORDER_RELEASE",
        quantity,
        previousStock: updated.currentStock - quantity,
        newStock: updated.currentStock,
        reason: `Stock restored for ${referenceType.replace("_", " ")} ${referenceId}`,
        actor,
        referenceType,
        referenceId,
      });

      released += 1;
    }

    if (released > 0) {
      for (const row of committed) {
        await refreshProductTotals(tx, row.productId);
      }
    }

      return { released, skipped };
    });
  } catch (error) {
    if (isUniqueTransactionError(error)) {
      return { released: 0, skipped: 0 };
    }
    throw error;
  }
}

function isUniqueTransactionError(error: unknown): boolean {
  return (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
