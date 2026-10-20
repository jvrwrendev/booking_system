/**
 * Base URL of the Agrivet API.
 *
 * - iOS simulator: http://localhost:4000/api/v1 (default below)
 * - Android emulator: http://10.0.2.2:4000/api/v1
 * - Physical device: http://<your-LAN-IP>:4000/api/v1
 *
 * Override by creating a `.env` file (see `.env.example`).
 */
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** `api/src/middleware/auth.middleware.ts` — routes that skip authentication. */
const PUBLIC_PATHS = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/logout",
]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

type UnauthorizedHandler = () => void;

const unauthorizedHandlers = new Set<UnauthorizedHandler>();

/**
 * Registers a callback invoked whenever an authenticated request comes back
 * 401 (expired, revoked, or missing session cookie). `useAuth` subscribes so
 * the client session is torn down instead of silently retrying.
 */
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

function isEnvelope(value: unknown): value is {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string; details?: unknown };
} {
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
}

/**
 * Issues a request against the API, unwrapping the `{ success, data }`
 * envelope. The httpOnly session cookie is carried automatically by React
 * Native's native networking stack.
 */
export async function request<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Could not reach the server. Check that the API is running."
    );
  }

  // A 401 on a public route (e.g. a failed login) is an expected answer,
  // not a session teardown.
  if (response.status === 401 && !PUBLIC_PATHS.has(path)) {
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
      payload.error?.code ?? "APP_ERROR",
      payload.error?.message ?? "Something went wrong.",
      payload.error?.details
    );
  }

  return payload.data as T;
}
