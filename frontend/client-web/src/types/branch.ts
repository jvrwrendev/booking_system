import type { AddressParts } from "@/lib/utils";

export interface Branch {
  id: string;
  name: string;
  code: string;
  email: string;
  password: string;
  manager: string;
  contactNumber: string;
  address: string;
  addressParts: AddressParts;
  totalProducts: number;
  totalStock: number;
  status: "active" | "inactive";
  createdAt: string;
}

export interface BranchFormValues {
  name: string;
  code: string;
  email: string;
  password: string;
  confirmPassword?: string;
  manager: string;
  contactNumber: string;
  addressParts: AddressParts;
  status: "active" | "inactive";
}
