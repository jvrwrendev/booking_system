import type { AddressParts } from "@/lib/utils";

export interface Customer {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  fullName: string;
  email: string;
  password: string;
  contactNumber: string;
  address: string;
  addressParts: AddressParts;
  assignedAgentId: string;
  assignedAgentName: string;
  totalBookings: number;
  totalPurchases: number;
  status: "active" | "inactive";
  registeredDate: string;
}

export interface CustomerFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  password: string;
  confirmPassword?: string;
  contactNumber: string;
  addressParts: AddressParts;
  assignedAgentId: string;
  status: "active" | "inactive";
}
