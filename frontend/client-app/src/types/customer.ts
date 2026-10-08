import type { AddressParts } from "./auth";

export interface Customer {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  fullName: string;
  email: string;
  contactNumber: string;
  gender?: string;
  address: string;
  addressParts: AddressParts;
  assignedAgentId: string;
  assignedAgentName: string;
  totalBookings: number;
  totalPurchases: number;
  status: "active" | "inactive";
  registeredDate: string;
  notes?: string;
}

export interface CustomerFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  contactNumber: string;
  gender?: string;
  addressParts: AddressParts;
  notes?: string;
}
