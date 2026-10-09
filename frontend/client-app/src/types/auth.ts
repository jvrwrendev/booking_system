import type { Role } from "./role";

export interface AddressRef {
  code: string;
  name: string;
}

export interface AddressParts {
  street: string;
  barangay: AddressRef;
  city: AddressRef;
  province: AddressRef;
  region: AddressRef;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: Role;
  status: "active" | "inactive";
  avatar?: string;
  contactNumber?: string;
  address?: string;
  lastLogin?: string;
  createdAt: string;
  agentId?: string;
  branchId?: string;
}

export interface AuthAccount extends AuthUser {
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterCredentials {
  role: Role;
  name: string;
  email: string;
  contactNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
  avatar?: string;
}

export interface UpdateProfileInput {
  fullName: string;
  email: string;
  contactNumber: string;
  address: string;
  avatar?: string;
}

export interface GoogleProfile {
  id: string;
  email: string;
  fullName: string;
}
