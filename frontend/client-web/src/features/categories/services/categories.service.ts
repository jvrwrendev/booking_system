import { request } from "@/lib/api-client";
import type {
  CategoryDto,
  CreateCategoryPayloadDto,
  ListCategoriesResponseDto,
  UpdateCategoryPayloadDto,
} from "@/types/api";
import type { Category, CategoryFormValues } from "@/types/category";

export interface ListCategoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** "all" or a domain status. */
  status?: string;
  sortBy?: "name" | "createdAt" | "productCount";
  sortOrder?: "asc" | "desc";
}

function toDtoStatus(status: string): "ACTIVE" | "INACTIVE" | undefined {
  if (status === "active") return "ACTIVE";
  if (status === "inactive") return "INACTIVE";
  return undefined;
}

export function toCategory(dto: CategoryDto): Category {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    productCount: dto.productCount,
    status: dto.status === "ACTIVE" ? "active" : "inactive",
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function listCategories(
  params: ListCategoriesParams = {},
): Promise<ListCategoriesResponseDto> {
  return request<ListCategoriesResponseDto>("/categories", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: toDtoStatus(params.status ?? ""),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
}

/** Used by product forms and filters; the API caps pageSize at 100. */
export async function listCategoryOptions(): Promise<Category[]> {
  const result = await listCategories({
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortOrder: "asc",
  });
  return result.categories.map(toCategory);
}

export async function getCategory(id: string): Promise<Category> {
  const { category } = await request<{ category: CategoryDto }>(
    `/categories/${id}`,
  );
  return toCategory(category);
}

function toPayload(
  values: CategoryFormValues,
): CreateCategoryPayloadDto {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    status: values.status === "active" ? "ACTIVE" : "INACTIVE",
  };
}

export async function createCategory(
  values: CategoryFormValues,
): Promise<Category> {
  const { category } = await request<{ category: CategoryDto }>("/categories", {
    method: "POST",
    body: toPayload(values),
  });
  return toCategory(category);
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues,
): Promise<Category> {
  const payload: UpdateCategoryPayloadDto = toPayload(values);
  const { category } = await request<{ category: CategoryDto }>(
    `/categories/${id}`,
    { method: "PATCH", body: payload },
  );
  return toCategory(category);
}

export async function deleteCategory(id: string): Promise<void> {
  await request<{ message: string }>(`/categories/${id}`, {
    method: "DELETE",
  });
}
