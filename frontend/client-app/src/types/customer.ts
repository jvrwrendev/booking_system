import type { AddressParts } from "./auth";

export interface Customer {
  id: string;
  fullName: string;
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
  fullName: string;
  contactNumber: string;
  gender?: string;
  addressParts: AddressParts;
  notes?: string;
}
