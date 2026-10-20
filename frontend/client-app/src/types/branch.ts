import type { AddressParts } from "./auth";

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
