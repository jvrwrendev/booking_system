export type CategoryStatus = "active" | "inactive";

export interface Category {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  createdAt: string;
}

export interface CategoryFormValues {
  name: string;
  description: string;
  status: CategoryStatus;
}
