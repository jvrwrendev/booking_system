import { ApiError, request } from "@/lib/api-client";
import type {
  Product,
  ProductListResult,
  ProductStatus,
  ProductStockStatus,
} from "@/types/product";
import { getProductStockStatus } from "@/types/product";

type ApiProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
type ApiStockStatus = "IN_STOCK" | "LOW_STOCK" | "CRITICAL" | "OUT_OF_STOCK";

interface ApiProduct {
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
  status: ApiProductStatus;
  stockStatus: ApiStockStatus;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiProductList {
  products: ApiProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: ProductStatus;
  stockStatus?: ProductStockStatus;
  sortBy?:
    | "name"
    | "sku"
    | "sellingPrice"
    | "stockQuantity"
    | "updatedAt"
    | "createdAt";
  sortOrder?: "asc" | "desc";
}

function toClientStatus(status: ApiProductStatus): ProductStatus {
  if (status === "ACTIVE") return "active";
  if (status === "INACTIVE") return "inactive";
  return "out_of_stock";
}

function toClientStockStatus(status: ApiStockStatus): ProductStockStatus {
  return status.toLowerCase() as ProductStockStatus;
}

function toProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId ?? "",
    categoryName: product.categoryName || "Uncategorized",
    brand: product.brand ?? "",
    description: product.description ?? "",
    unit: product.unit,
    costPrice: Number(product.costPrice),
    sellingPrice: Number(product.sellingPrice),
    stockQuantity: product.stockQuantity,
    minimumStockLevel: product.minimumStockLevel,
    supplier: product.supplierName ?? product.supplier ?? "",
    status: toClientStatus(product.status),
    image: product.image ?? undefined,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function buildQuery(query: ProductQuery): string {
  const params: string[] = [];
  const add = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === "") return;
    params.push(`${key}=${encodeURIComponent(String(value))}`);
  };

  add("page", query.page);
  add("pageSize", query.pageSize);
  add("search", query.search?.trim());
  add("categoryId", query.categoryId);
  add("status", query.status?.toUpperCase());
  add("stockStatus", query.stockStatus?.toUpperCase());
  add("sortBy", query.sortBy);
  add("sortOrder", query.sortOrder);

  return params.length > 0 ? `?${params.join("&")}` : "";
}

/**
 * Fetches one page of the live catalog. Agents and branches both have
 * read-only access; only admins can create or update products.
 */
export async function listProductsPage(
  query: ProductQuery = {},
): Promise<ProductListResult> {
  const data = await request<ApiProductList>(`/products${buildQuery(query)}`);

  return {
    products: data.products.map(toProduct),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
  };
}

/**
 * Compatibility helper for screens that consume the whole active catalog
 * (booking/order builders, favorites, dashboards).
 */
export async function listProducts(): Promise<Product[]> {
  const result = await listProductsPage({
    page: 1,
    pageSize: 100,
    status: "active",
    sortBy: "name",
    sortOrder: "asc",
  });
  return result.products;
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const data = await request<{ product: ApiProduct }>(
      `/products/${encodeURIComponent(id)}`,
    );
    return toProduct(data.product);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function computeStockStatus(p: Product): ProductStockStatus {
  return getProductStockStatus(p);
}

export { toClientStockStatus };
