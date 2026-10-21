import type { Prisma, SupplierStatus } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateSupplierDto,
  ListSuppliersQueryDto,
  UpdateSupplierDto,
} from "./dto/index.js";

const SUPPLIER_SELECT = {
  id: true,
  name: true,
  contactName: true,
  contactNumber: true,
  address: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} satisfies Prisma.SupplierSelect;

type SupplierRecord = Prisma.SupplierGetPayload<{ select: typeof SUPPLIER_SELECT }>;

export interface SupplierView {
  id: string;
  name: string;
  contactName: string | null;
  contactNumber: string | null;
  address: string | null;
  status: SupplierStatus;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListSuppliersResult {
  suppliers: SupplierView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toSupplierView(supplier: SupplierRecord): SupplierView {
  return {
    id: supplier.id,
    name: supplier.name,
    contactName: supplier.contactName,
    contactNumber: supplier.contactNumber,
    address: supplier.address,
    status: supplier.status,
    productCount: supplier._count.products,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

function isUniqueNameError(error: unknown): boolean {
  return (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function assertNameAvailable(
  name: string,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.supplier.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw Errors.conflict("A supplier with that name already exists");
  }
}

async function mustGetSupplier(id: string): Promise<SupplierView> {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: SUPPLIER_SELECT,
  });

  if (!supplier) throw Errors.notFound("Supplier not found");
  return toSupplierView(supplier);
}

export async function listSuppliers(
  query: ListSuppliersQueryDto,
): Promise<ListSuppliersResult> {
  const where: Prisma.SupplierWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { contactName: { contains: query.search, mode: "insensitive" } },
      { contactNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.status) where.status = query.status;

  const orderBy: Prisma.SupplierOrderByWithRelationInput = {
    [query.sortBy]: query.sortOrder,
  };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      select: SUPPLIER_SELECT,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    suppliers: suppliers.map(toSupplierView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getSupplierById(id: string): Promise<SupplierView> {
  return mustGetSupplier(id);
}

export async function createSupplier(
  input: CreateSupplierDto,
): Promise<SupplierView> {
  await assertNameAvailable(input.name);

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: input.name,
        contactName: input.contactName || null,
        contactNumber: input.contactNumber || null,
        address: input.address || null,
        status: input.status,
      },
      select: SUPPLIER_SELECT,
    });
    return toSupplierView(supplier);
  } catch (error) {
    if (isUniqueNameError(error)) {
      throw Errors.conflict("A supplier with that name already exists");
    }
    throw error;
  }
}

export async function updateSupplier(
  id: string,
  input: UpdateSupplierDto,
): Promise<SupplierView> {
  await mustGetSupplier(id);

  if (input.name) {
    await assertNameAvailable(input.name, id);
  }

  try {
    const supplier = await prisma.$transaction(async (tx) => {
      const updated = await tx.supplier.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.contactName !== undefined
            ? { contactName: input.contactName || null }
            : {}),
          ...(input.contactNumber !== undefined
            ? { contactNumber: input.contactNumber || null }
            : {}),
          ...(input.address !== undefined
            ? { address: input.address || null }
            : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
        select: SUPPLIER_SELECT,
      });

      // Keep the legacy denormalized product column in sync with the relation.
      if (input.name !== undefined) {
        await tx.product.updateMany({
          where: { supplierId: id },
          data: { supplier: updated.name },
        });
      }

      return updated;
    });

    return toSupplierView(supplier);
  } catch (error) {
    if (isUniqueNameError(error)) {
      throw Errors.conflict("A supplier with that name already exists");
    }
    throw error;
  }
}

export async function deleteSupplier(id: string): Promise<void> {
  await mustGetSupplier(id);

  await prisma.$transaction(async (tx) => {
    // Clear the denormalized name too; the relation itself is SET NULL by the
    // foreign key, so affected products simply become supplier-less.
    await tx.product.updateMany({
      where: { supplierId: id },
      data: { supplier: null },
    });
    await tx.supplier.delete({ where: { id } });
  });
}
