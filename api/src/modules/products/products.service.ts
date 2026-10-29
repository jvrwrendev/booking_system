import type { Prisma, ProductStatus } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import {
  computeStockStatus,
  deriveProductStatus,
} from "../../lib/stock.js";
import {
  ensureStockRow,
  resolveBranchId,
} from "../inventory/inventory.service.js";
import type {
  BulkDeleteProductsDto,
  CreateProductDto,
  ListProductsQueryDto,
  ProductFiltersDto,
  UpdateProductDto,
} from "./dto/index.js";

const PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true } },
  supplierRef: { select: { id: true, name: true } },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

export interface ProductView {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
  brand: string | null;
  description: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  supplier: string | null;
  status: ProductStatus;
  stockStatus: string;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListProductsResult {
  products: ProductView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductActor {
  id: string;
  name: string;
}

function toProductView(product: ProductRecord): ProductView {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? "Uncategorized",
    supplierId: product.supplierId,
    supplierName: product.supplierRef?.name ?? product.supplier,
    brand: product.brand,
    description: product.description,
    unit: product.unit,
    costPrice: Number(product.costPrice),
    sellingPrice: Number(product.sellingPrice),
    stockQuantity: product.stockQuantity,
    minimumStockLevel: product.minimumStockLevel,
    supplier: product.supplier,
    status: product.status,
    stockStatus: product.stockStatus,
    image: product.image,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function mustGetProduct(id: string): Promise<ProductRecord> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });

  if (!product) throw Errors.notFound("Product not found");
  return product;
}

async function assertCategoryExists(
  categoryId: string | null | undefined,
): Promise<void> {
  if (!categoryId) return;
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw Errors.badRequest("Selected category does not exist");
}

async function assertSkuAvailable(
  sku: string,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: {
      sku: { equals: sku, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) throw Errors.conflict("A product with that SKU already exists");
}

interface SupplierSelection {
  supplierId: string | null;
  supplier: string | null;
}

/**
 * Resolves a supplier relation for a write. `supplierId` wins; the legacy
 * `supplier` string is still accepted so older clients keep working. An empty
 * or omitted selection stores no supplier.
 */
async function resolveSupplierSelection(
  tx: Prisma.TransactionClient,
  supplierId: string | null | undefined,
  legacyName: string | null | undefined,
): Promise<SupplierSelection | null> {
  if (supplierId !== undefined) {
    const trimmed = supplierId?.trim();
    if (!trimmed) {
      return { supplierId: null, supplier: null };
    }

    const supplier = await tx.supplier.findUnique({
      where: { id: trimmed },
      select: { id: true, name: true },
    });

    if (!supplier) {
      throw Errors.badRequest("Selected supplier does not exist");
    }

    return { supplierId: supplier.id, supplier: supplier.name };
  }

  if (legacyName !== undefined) {
    const trimmed = legacyName?.trim();
    if (!trimmed) {
      return { supplierId: null, supplier: null };
    }

    const supplier = await tx.supplier.findFirst({
      where: { name: { equals: trimmed, mode: "insensitive" } },
      select: { id: true, name: true },
    });

    return supplier
      ? { supplierId: supplier.id, supplier: supplier.name }
      : { supplierId: null, supplier: trimmed };
  }

  return null;
}

function buildProductWhere(query: ProductFiltersDto): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { sku: { contains: query.search, mode: "insensitive" } },
      { brand: { contains: query.search, mode: "insensitive" } },
      { supplier: { contains: query.search, mode: "insensitive" } },
      { supplierRef: { name: { contains: query.search, mode: "insensitive" } } },
      { description: { contains: query.search, mode: "insensitive" } },
      { category: { name: { contains: query.search, mode: "insensitive" } } },
    ];
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.status) where.status = query.status;
  if (query.stockStatus) where.stockStatus = query.stockStatus;

  return where;
}

export async function listProducts(
  query: ListProductsQueryDto,
): Promise<ListProductsResult> {
  const where = buildProductWhere(query);

  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: PRODUCT_INCLUDE,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map(toProductView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getProductById(id: string): Promise<ProductView> {
  return toProductView(await mustGetProduct(id));
}

export async function createProduct(
  input: CreateProductDto,
  actor: ProductActor,
): Promise<ProductView> {
  await assertCategoryExists(input.categoryId);
  await assertSkuAvailable(input.sku);

  const product = await prisma.$transaction(async (tx) => {
    const branchId = await resolveBranchId(tx, input.branchId);
    const supplier = await resolveSupplierSelection(
      tx,
      input.supplierId,
      input.supplier,
    );
    const stockStatus = computeStockStatus(
      input.stockQuantity,
      input.minimumStockLevel,
    );
    const status = deriveProductStatus(input.status, input.stockQuantity);

    const created = await tx.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        categoryId: input.categoryId || null,
        supplierId: supplier?.supplierId ?? null,
        brand: input.brand || null,
        description: input.description || null,
        unit: input.unit,
        costPrice: input.costPrice,
        sellingPrice: input.sellingPrice,
        stockQuantity: input.stockQuantity,
        minimumStockLevel: input.minimumStockLevel,
        supplier: supplier?.supplier ?? null,
        status,
        stockStatus,
        image: input.image ?? null,
      },
      include: PRODUCT_INCLUDE,
    });

    await tx.inventoryStock.create({
      data: {
        productId: created.id,
        branchId,
        currentStock: input.stockQuantity,
        minimumStock: input.minimumStockLevel,
        status: stockStatus,
      },
    });

    if (input.stockQuantity > 0) {
      await tx.inventoryTransaction.create({
        data: {
          productId: created.id,
          branchId,
          type: "STOCK_IN",
          quantity: input.stockQuantity,
          previousStock: 0,
          newStock: input.stockQuantity,
          reason: input.reason || "Opening stock",
          performedById: actor.id,
          performedByName: actor.name,
          referenceType: "PRODUCT_OPENING",
          referenceId: created.id,
        },
      });
    }

    return created;
  });

  return toProductView(product);
}

export async function updateProduct(
  id: string,
  input: UpdateProductDto,
  actor: ProductActor,
): Promise<ProductView> {
  await mustGetProduct(id);
  if (input.categoryId !== undefined) {
    await assertCategoryExists(input.categoryId);
  }
  if (input.sku) {
    await assertSkuAvailable(input.sku, id);
  }

  const product = await prisma.$transaction(async (tx) => {
    const current = await tx.product.findUniqueOrThrow({ where: { id } });
    const supplier = await resolveSupplierSelection(
      tx,
      input.supplierId,
      input.supplier,
    );
    const newMinimum = input.minimumStockLevel ?? current.minimumStockLevel;
    let totalStock = current.stockQuantity;

    if (input.stockQuantity !== undefined && input.stockQuantity !== current.stockQuantity) {
      const preferredBranch = input.branchId
        ? await resolveBranchId(tx, input.branchId)
        : (
            await tx.inventoryStock.findFirst({
              where: { productId: id, currentStock: { gt: 0 } },
              orderBy: { currentStock: "desc" },
              select: { branchId: true },
            })
          )?.branchId ?? (await resolveBranchId(tx));

      const row = await ensureStockRow(tx, id, preferredBranch, newMinimum);
      const delta = input.stockQuantity - current.stockQuantity;

      if (delta > 0) {
        const updated = await tx.inventoryStock.update({
          where: { id: row.id },
          data: { currentStock: { increment: delta } },
        });
        await tx.inventoryStock.update({
          where: { id: row.id },
          data: {
            status: computeStockStatus(updated.currentStock, newMinimum),
          },
        });
      } else if (delta < 0) {
        const quantity = Math.abs(delta);
        const result = await tx.inventoryStock.updateMany({
          where: { id: row.id, currentStock: { gte: quantity } },
          data: { currentStock: { decrement: quantity } },
        });
        if (result.count === 0) {
          throw Errors.conflict(
            "The current branch does not hold enough stock to apply this quantity. Use an inventory transfer or adjustment per branch.",
          );
        }
        const updated = await tx.inventoryStock.findUniqueOrThrow({
          where: { id: row.id },
        });
        await tx.inventoryStock.update({
          where: { id: row.id },
          data: {
            status: computeStockStatus(updated.currentStock, newMinimum),
          },
        });
      }

      totalStock = input.stockQuantity;

      await tx.inventoryTransaction.create({
        data: {
          productId: id,
          branchId: preferredBranch,
          type: "ADJUSTMENT",
          quantity: delta,
          previousStock: current.stockQuantity,
          newStock: totalStock,
          reason: input.reason || "Product stock updated from catalog",
          performedById: actor.id,
          performedByName: actor.name,
          referenceType: "PRODUCT_UPDATE",
          referenceId: `${id}-${Date.now()}`,
        },
      });
    }

    if (input.minimumStockLevel !== undefined) {
      const rows = await tx.inventoryStock.findMany({
        where: { productId: id },
        select: { id: true, currentStock: true },
      });
      for (const row of rows) {
        await tx.inventoryStock.update({
          where: { id: row.id },
          data: {
            minimumStock: newMinimum,
            status: computeStockStatus(row.currentStock, newMinimum),
          },
        });
      }
    }

    const requestedStatus = input.status ?? current.status;
    const status = deriveProductStatus(requestedStatus, totalStock);

    const updated = await tx.product.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.categoryId !== undefined
          ? { categoryId: input.categoryId || null }
          : {}),
        ...(input.brand !== undefined ? { brand: input.brand || null } : {}),
        ...(input.description !== undefined
          ? { description: input.description || null }
          : {}),
        ...(input.unit !== undefined ? { unit: input.unit } : {}),
        ...(input.costPrice !== undefined ? { costPrice: input.costPrice } : {}),
        ...(input.sellingPrice !== undefined
          ? { sellingPrice: input.sellingPrice }
          : {}),
        ...(input.stockQuantity !== undefined
          ? { stockQuantity: input.stockQuantity }
          : {}),
        ...(input.minimumStockLevel !== undefined
          ? { minimumStockLevel: input.minimumStockLevel }
          : {}),
        ...(supplier
          ? { supplierId: supplier.supplierId, supplier: supplier.supplier }
          : {}),
        ...(input.status !== undefined ? { status } : { status }),
        stockStatus: computeStockStatus(totalStock, newMinimum),
        ...(input.image !== undefined ? { image: input.image || null } : {}),
      },
      include: PRODUCT_INCLUDE,
    });

    return updated;
  });

  return toProductView(product);
}

export async function deleteProduct(id: string): Promise<void> {
  await mustGetProduct(id);
  await prisma.product.delete({ where: { id } });
}

export interface BulkDeleteProductsResult {
  deleted: number;
}

/**
 * Deletes products either by an explicit id list or by the same filters the
 * list page uses. Relation rows are removed by the schema's cascade rules.
 */
export async function bulkDeleteProducts(
  input: BulkDeleteProductsDto,
): Promise<BulkDeleteProductsResult> {
  const where: Prisma.ProductWhereInput = input.selectAll
    ? {
        ...buildProductWhere(input.filters ?? {}),
        ...(input.excludeIds.length > 0
          ? { id: { notIn: input.excludeIds } }
          : {}),
      }
    : { id: { in: input.ids ?? [] } };

  const { count } = await prisma.product.deleteMany({ where });
  return { deleted: count };
}
