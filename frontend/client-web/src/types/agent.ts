import type { AddressParts } from "@/lib/utils";

export type AgentStatus = "active" | "inactive" | "suspended";

export interface Agent {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  address: string;
  addressParts: AddressParts;
  totalBookings: number;
  status: AgentStatus;
  dateJoined: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  contactNumber: string;
  addressParts: AddressParts;
  status: AgentStatus;
}
