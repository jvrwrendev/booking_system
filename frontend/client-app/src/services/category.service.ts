import { ApiError, request } from "@/lib/api-client";
import type { Category, CategoryStatus } from "@/types/category";

interface ApiCategory {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiCategoryList {
  categories: ApiCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toStatus(status: ApiCategory["status"]): CategoryStatus {
  return status === "ACTIVE" ? "active" : "inactive";
}

function toCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    status: toStatus(category.status),
    productCount: category.productCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

const ACTIVE_CATEGORIES_QUERY = "?status=ACTIVE&pageSize=100&sortBy=name&sortOrder=asc";

/**
 * Categories are readable by agents and branches. Only active categories are
 * shown in the client catalog.
 */
export async function listCategories(): Promise<Category[]> {
  const data = await request<ApiCategoryList>(
    `/categories${ACTIVE_CATEGORIES_QUERY}`,
  );
  return data.categories.map(toCategory);
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const data = await request<{ category: ApiCategory }>(
      `/categories/${encodeURIComponent(id)}`,
    );
    return toCategory(data.category);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
