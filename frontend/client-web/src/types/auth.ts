import type { Role } from "@/lib/permissions";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: Role;
  status: "active" | "inactive";
  avatar?: string;
  contactNumber?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}