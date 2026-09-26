export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface CategoryFormValues {
  name: string;
  description: string;
  status: "active" | "inactive";
}