export type CategoryStatus = "active" | "inactive";

export interface Category {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResult {
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
