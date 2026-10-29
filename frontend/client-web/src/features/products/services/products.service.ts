import { request } from "@/lib/api-client";
import type {
  CreateProductPayloadDto,
  ListProductsResponseDto,
  ProductDto,
  ProductStatusDto,
  StockStatusDto,
} from "@/types/api";
import type {
  Product,
  ProductFormValues,
  ProductStatus,
  ProductStockStatus,
} from "@/types/product";

export interface ListProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  /** "all" or a category id. */
  categoryId?: string;
  /** "all" or a domain product status. */
  status?: string;
  /** "all" or a lowercase stock status. */
  stockStatus?: string;
  sortBy?: "name" | "sku" | "sellingPrice" | "stockQuantity" | "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}

function toStatusDto(status: string): ProductStatusDto {
  const normalized = status.toLowerCase();
  if (normalized === "inactive") return "INACTIVE";
  if (normalized === "out_of_stock") return "OUT_OF_STOCK";
  return "ACTIVE";
}

function fromStatusDto(status: ProductStatusDto): ProductStatus {
  if (status === "INACTIVE") return "inactive";
  if (status === "OUT_OF_STOCK") return "out_of_stock";
  return "active";
}

function fromStockStatusDto(status: StockStatusDto): ProductStockStatus {
  switch (status) {
    case "LOW_STOCK":
      return "low_stock";
    case "CRITICAL":
      return "critical";
    case "OUT_OF_STOCK":
      return "out_of_stock";
    default:
      return "in_stock";
  }
}

function toStockStatusDto(status: string | undefined): StockStatusDto | undefined {
  switch (status) {
    case "in_stock":
      return "IN_STOCK";
    case "low_stock":
      return "LOW_STOCK";
    case "critical":
      return "CRITICAL";
    case "out_of_stock":
      return "OUT_OF_STOCK";
    default:
      return undefined;
  }
}

export function toProduct(dto: ProductDto): Product {
  return {
    id: dto.id,
    name: dto.name,
    sku: dto.sku,
    categoryId: dto.categoryId ?? "",
    categoryName: dto.categoryName,
    supplierId: dto.supplierId ?? "",
    supplierName: dto.supplierName ?? dto.supplier ?? undefined,
    brand: dto.brand ?? "",
    description: dto.description ?? "",
    unit: dto.unit,
    costPrice: dto.costPrice,
    sellingPrice: dto.sellingPrice,
    stockQuantity: dto.stockQuantity,
    minimumStockLevel: dto.minimumStockLevel,
    supplier: dto.supplierName ?? dto.supplier ?? "",
    status: fromStatusDto(dto.status),
    stockStatus: fromStockStatusDto(dto.stockStatus),
    image: dto.image ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function listProducts(
  params: ListProductsParams = {},
): Promise<ListProductsResponseDto> {
  return request<ListProductsResponseDto>("/products", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      categoryId:
        params.categoryId && params.categoryId !== "all"
          ? params.categoryId
          : undefined,
      status:
        params.status && params.status !== "all"
          ? toStatusDto(params.status as ProductStatus)
          : undefined,
      stockStatus: toStockStatusDto(params.stockStatus),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });
}

export async function getProduct(id: string): Promise<Product> {
  const { product } = await request<{ product: ProductDto }>(`/products/${id}`);
  return toProduct(product);
}

function toPayload(values: ProductFormValues): CreateProductPayloadDto {
  return {
    name: values.name.trim(),
    sku: values.sku.trim().toUpperCase(),
    categoryId: values.categoryId || null,
    supplierId: values.supplierId || null,
    brand: values.brand.trim(),
    description: values.description.trim(),
    unit: values.unit.trim() || "piece",
    costPrice: values.costPrice,
    sellingPrice: values.sellingPrice,
    stockQuantity: values.stockQuantity,
    minimumStockLevel: values.minimumStockLevel,
    status: toStatusDto(values.status),
    image: values.image ?? null,
  };
}

export async function createProduct(
  values: ProductFormValues,
): Promise<Product> {
  const { product } = await request<{ product: ProductDto }>("/products", {
    method: "POST",
    body: toPayload(values),
  });
  return toProduct(product);
}

export async function updateProduct(
  id: string,
  values: ProductFormValues,
): Promise<Product> {
  const { product } = await request<{ product: ProductDto }>(`/products/${id}`, {
    method: "PATCH",
    body: toPayload(values),
  });
  return toProduct(product);
}

export async function deleteProduct(id: string): Promise<void> {
  await request<{ message: string }>(`/products/${id}`, { method: "DELETE" });
}

export interface BulkDeleteProductsParams {
  /** Explicit ids to delete. Ignored when `selectAll` is set. */
  ids?: string[];
  /** Delete every product matching `filters` instead of `ids`. */
  selectAll?: boolean;
  filters?: ListProductsParams;
  /** Rows unchecked by the user while in select-all mode. */
  excludeIds?: string[];
}

export interface BulkDeleteProductsResponse {
  deleted: number;
}

export function bulkDeleteProducts(
  params: BulkDeleteProductsParams,
): Promise<BulkDeleteProductsResponse> {
  return request<BulkDeleteProductsResponse>("/products/bulk-delete", {
    method: "POST",
    body: {
      ids: params.ids,
      selectAll: params.selectAll,
      filters: params.filters
        ? {
            search: params.filters.search || undefined,
            categoryId:
              params.filters.categoryId && params.filters.categoryId !== "all"
                ? params.filters.categoryId
                : undefined,
            status:
              params.filters.status && params.filters.status !== "all"
                ? toStatusDto(params.filters.status)
                : undefined,
            stockStatus: toStockStatusDto(params.filters.stockStatus),
          }
        : undefined,
      excludeIds: params.excludeIds,
    },
  });
}
