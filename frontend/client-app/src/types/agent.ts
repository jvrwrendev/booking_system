import type { AddressParts } from "./auth";

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
  status: "active" | "inactive" | "suspended";
  dateJoined: string;
}
