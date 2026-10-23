export type ProductStatus = "active" | "inactive" | "out_of_stock";

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  description: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  supplier: string;
  status: ProductStatus;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ProductStockStatus =
  | "in_stock"
  | "low_stock"
  | "critical"
  | "out_of_stock";

export function getProductStockStatus(
  p: Pick<Product, "stockQuantity" | "minimumStockLevel">
): ProductStockStatus {
  if (p.stockQuantity <= 0) return "out_of_stock";
  if (p.stockQuantity <= Math.max(p.minimumStockLevel / 2, 1))
    return "critical";
  if (p.stockQuantity <= p.minimumStockLevel) return "low_stock";
  return "in_stock";
}
