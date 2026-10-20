import type { Role } from "@/lib/permissions";

export type AccountStatus = "active" | "inactive" | "suspended";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: AccountStatus;
  createdAt: string;
  /**
   * Only present on mock fixtures. The API has no `username` column — login
   * is by email, and the API's `PublicUser` carries no such field.
   */
  username?: string;
  avatar?: string;
  contactNumber?: string;
  /** Only present on mock fixtures; the API does not track last sign-in. */
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}