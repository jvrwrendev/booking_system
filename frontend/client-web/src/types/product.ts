export type ProductStatus = "active" | "inactive";

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  unit: string;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  status: ProductStatus;
  image?: string;
  /** Optional commercial detail. Kept out of the required field set. */
  brand?: string;
  costPrice?: number;
  supplier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  categoryId: string;
  description: string;
  unit: string;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  status: ProductStatus;
  image?: string;
  brand: string;
  costPrice: number;
  supplier: string;
}
