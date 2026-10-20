import type { AddressParts } from "@/lib/utils";

export type AgentStatus = "active" | "inactive" | "suspended";

export interface Agent {
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
  totalBookings: number;
  status: AgentStatus;
  dateJoined: string;
}

export interface AgentFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  password: string;
  confirmPassword?: string;
  contactNumber: string;
  addressParts: AddressParts;
  status: AgentStatus;
}
