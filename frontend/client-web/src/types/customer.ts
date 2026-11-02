import type { AddressParts } from "@/lib/utils";

export interface Customer {
  id: string;
  fullName: string;
  contactNumber: string;
  gender: string;
  address: string;
  addressParts: AddressParts;
  assignedAgentId: string;
  assignedAgentName: string;
  totalBookings: number;
  totalPurchases: number;
  notes: string;
  status: "active" | "inactive";
  registeredDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormValues {
  fullName: string;
  contactNumber: string;
  gender: string;
  addressParts: AddressParts;
  assignedAgentId: string;
  notes: string;
  status: "active" | "inactive";
}
