import type { ApiEnvelope } from "@/types/api";

/**
 * The dev server proxies `/api` to the backend (see `vite.config.ts`), so
 * requests are same-origin and the httpOnly session cookie rides along
 * automatically. The env override exists for setups that skip the proxy.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/** `api/src/config/env.ts` — `PUBLIC_PATHS` are the only unauthenticated routes. */
const PUBLIC_PATHS = new Set(["/auth/login", "/auth/logout"]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Duplicate email, or a rule such as "cannot delete the last super admin". */
  get isConflict(): boolean {
    return this.status === 409;
  }
}

type UnauthorizedHandler = () => void;

const unauthorizedHandlers = new Set<UnauthorizedHandler>();

/**
 * Registers a callback invoked whenever a request comes back 401.
 *
 * `useAuth` subscribes to this so an expired or revoked session tears down
 * client state. A subscriber set (rather than an import of the auth hook)
 * keeps `api-client` free of React dependencies and avoids a cycle.
 */
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean"
  );
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
}

export async function request<T>(
  path: string,
  { method = "GET", body, signal, query }: RequestOptions = {}
): Promise<T> {
  const isPublic = PUBLIC_PATHS.has(path);

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Check that the API is running."
    );
  }

  // A 401 on a public route (e.g. a failed login) is an expected answer, not
  // a session teardown.
  if (response.status === 401 && !isPublic) {
    unauthorizedHandlers.forEach((handler) => handler());
  }

  if (response.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      `Server returned an unreadable response (HTTP ${response.status}).`
    );
  }

  if (!isEnvelope(payload)) {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "Server returned an unexpected response shape."
    );
  }

  if (!payload.success) {
    throw new ApiError(
      response.status,
      payload.error.code,
      payload.error.message,
      payload.error.details
    );
  }

  return payload.data as T;
}
