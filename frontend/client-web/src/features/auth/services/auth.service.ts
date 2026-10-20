import { request } from "@/lib/api-client";
import type {
  ChangePasswordPayloadDto,
  LoginResponseDto,
  PublicUserDto,
  SessionDto,
} from "@/types/api";

/**
 * Auth endpoints. All of them ride on the httpOnly session cookie, so every
 * request is sent with credentials by `api-client`.
 */

/** `POST /api/v1/auth/login` — rate limited to 10 attempts / 15 min. */
export function login(credentials: {
  email: string;
  password: string;
}): Promise<LoginResponseDto> {
  return request<LoginResponseDto>("/auth/login", {
    method: "POST",
    body: { email: credentials.email.trim(), password: credentials.password },
  });
}

/** `POST /api/v1/auth/logout` — revokes the current session and clears the cookie. */
export function logout(): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/logout", { method: "POST" });
}

/** `GET /api/v1/auth/me` — re-reads the user from the database on every call. */
export function getCurrentUser(): Promise<{ user: PublicUserDto }> {
  return request<{ user: PublicUserDto }>("/auth/me");
}

/** `POST /api/v1/auth/change-password` — revokes every *other* session. */
export function changePassword(
  payload: ChangePasswordPayloadDto
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: payload,
  });
}

export interface CurrentSessionDto extends SessionDto {
  current: boolean;
}

export function listSessions(): Promise<{ sessions: CurrentSessionDto[] }> {
  return request<{ sessions: CurrentSessionDto[] }>("/auth/sessions");
}

export function revokeSession(id: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/auth/sessions/${id}`, {
    method: "DELETE",
  });
}

export function revokeAllSessions(): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/sessions", { method: "DELETE" });
}
