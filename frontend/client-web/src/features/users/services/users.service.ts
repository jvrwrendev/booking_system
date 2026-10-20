import { request } from "@/lib/api-client";
import type { AccountStatus } from "@/types/auth";
import type {
  AccountStatusDto,
  CreateUserPayloadDto,
  ListUsersResponseDto,
  PublicUserDto,
  UpdateUserPayloadDto,
} from "@/types/api";
import { toAuthUser, toStatusDto } from "../lib/user-mapper";
import type { AuthUser } from "@/types/auth";

/**
 * Admin user management. Every route here sits behind the API's
 * `requireRole("ADMIN")` guard, so an ADMIN or SUPER_ADMIN cookie is required.
 */

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export function listUsers(params: ListUsersParams = {}): Promise<ListUsersResponseDto> {
  return request<ListUsersResponseDto>("/users", { query: { ...params } });
}

export async function getUser(id: string): Promise<AuthUser> {
  const { user } = await request<{ user: PublicUserDto }>(`/users/${id}`);
  return toAuthUser(user);
}

/** `POST /api/v1/users` — 409 if the email is already taken. */
export async function createUser(payload: CreateUserPayloadDto): Promise<AuthUser> {
  const { user } = await request<{ user: PublicUserDto }>("/users", {
    method: "POST",
    body: payload,
  });
  return toAuthUser(user);
}

/** `PATCH /api/v1/users/:id` — requires at least one field. */
export async function updateUser(
  id: string,
  payload: UpdateUserPayloadDto
): Promise<AuthUser> {
  const { user } = await request<{ user: PublicUserDto }>(`/users/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return toAuthUser(user);
}

/** `PATCH /api/v1/users/:id/status` — the API blocks self-targeted changes. */
export async function setUserStatus(
  id: string,
  status: AccountStatus
): Promise<AuthUser> {
  const { user } = await request<{ user: PublicUserDto }>(`/users/${id}/status`, {
    method: "PATCH",
    body: { status: toStatusDto(status) } satisfies { status: AccountStatusDto },
  });
  return toAuthUser(user);
}

/** `PATCH /api/v1/users/:id/password` — admin-set, no current password needed. */
export async function setUserPassword(
  id: string,
  password: string
): Promise<{ message: string }> {
  return request<{ message: string }>(`/users/${id}/password`, {
    method: "PATCH",
    body: { password },
  });
}

/** `DELETE /api/v1/users/:id` — hard delete; 409 protects the last super admin. */
export async function deleteUser(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/users/${id}`, { method: "DELETE" });
}
