import type { CategoryStatus, Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateCategoryDto,
  ListCategoriesQueryDto,
  UpdateCategoryDto,
} from "./dto/index.js";

const CATEGORY_SELECT = {
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} satisfies Prisma.CategorySelect;

type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof CATEGORY_SELECT }>;

export interface CategoryView {
  id: string;
  name: string;
  description: string | null;
  status: CategoryStatus;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCategoriesResult {
  categories: CategoryView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toCategoryView(category: CategoryRecord): CategoryView {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    status: category.status,
    productCount: category._count.products,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
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
  const existing = await prisma.category.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw Errors.conflict("A category with that name already exists");
  }
}

async function mustGetCategory(id: string): Promise<CategoryView> {
  const category = await prisma.category.findUnique({
    where: { id },
    select: CATEGORY_SELECT,
  });

  if (!category) {
    throw Errors.notFound("Category not found");
  }

  return toCategoryView(category);
}

export async function listCategories(
  query: ListCategoriesQueryDto,
): Promise<ListCategoriesResult> {
  const where: Prisma.CategoryWhereInput = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.status) {
    where.status = query.status;
  }

  const orderBy: Prisma.CategoryOrderByWithRelationInput =
    query.sortBy === "productCount"
      ? { products: { _count: query.sortOrder } }
      : { [query.sortBy]: query.sortOrder };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      select: CATEGORY_SELECT,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.category.count({ where }),
  ]);

  return {
    categories: categories.map(toCategoryView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getCategoryById(id: string): Promise<CategoryView> {
  return mustGetCategory(id);
}

export async function createCategory(
  input: CreateCategoryDto,
): Promise<CategoryView> {
  await assertNameAvailable(input.name);

  try {
    const category = await prisma.category.create({
      data: {
        name: input.name,
        description: input.description || null,
        status: input.status,
      },
      select: CATEGORY_SELECT,
    });
    return toCategoryView(category);
  } catch (error) {
    if (isUniqueNameError(error)) {
      throw Errors.conflict("A category with that name already exists");
    }
    throw error;
  }
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryDto,
): Promise<CategoryView> {
  await mustGetCategory(id);

  if (input.name) {
    await assertNameAvailable(input.name, id);
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description ?? null }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      select: CATEGORY_SELECT,
    });
    return toCategoryView(category);
  } catch (error) {
    if (isUniqueNameError(error)) {
      throw Errors.conflict("A category with that name already exists");
    }
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  await mustGetCategory(id);
  // Products keep their history but become uncategorized (onDelete: SetNull).
  await prisma.category.delete({ where: { id } });
}
