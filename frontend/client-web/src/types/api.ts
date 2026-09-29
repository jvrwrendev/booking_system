/**
 * Wire types for the Agrivet booking API.
 *
 * These mirror the API exactly (`api/src/lib/api-response.ts`,
 * `api/src/lib/user-select.ts`, `api/src/modules/*`). Domain types used by
 * the UI live in `src/types/*`; never import this file into a component.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type AccountStatusDto = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type RoleDto = "SUPER_ADMIN" | "ADMIN";

/** `api/src/lib/user-select.ts` — `PUBLIC_USER_SELECT`. */
export interface PublicUserDto {
  id: string;
  name: string;
  email: string;
  role: RoleDto;
  status: AccountStatusDto;
  /** JSON date string. */
  createdAt: string;
  /** JSON date string. */
  updatedAt: string;
}

export interface SessionDto {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

/** `api/src/modules/users/users.types.ts` — `ListUsersResult`. */
export interface ListUsersResponseDto {
  users: PublicUserDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** `api/src/modules/auth/auth.controller.ts:39` — login response body. */
export interface LoginResponseDto {
  user: PublicUserDto;
  session: SessionDto;
}

export interface CreateUserPayloadDto {
  name: string;
  email: string;
  password: string;
  role: RoleDto;
  status: AccountStatusDto;
}

export type UpdateUserPayloadDto = Partial<{
  name: string;
  email: string;
  role: RoleDto;
  status: AccountStatusDto;
}>;

export interface ChangePasswordPayloadDto {
  currentPassword: string;
  newPassword: string;
}
