export type SupplierStatus = "active" | "inactive";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  contactNumber?: string;
  address?: string;
  status: SupplierStatus;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormValues {
  name: string;
  contactName: string;
  email: string;
  contactNumber: string;
  address: string;
  status: SupplierStatus;
}
