import { Platform } from "react-native";
import Constants from "expo-constants";

const API_PORT = 4000;

/**
 * Resolves the API base URL.
 *
 * In development the app is often opened from another machine or a physical
 * device (e.g. http://192.168.1.43:8081). In that case `localhost` would point
 * at the *client*, not the machine running the API. We therefore derive the
 * host the app itself was loaded from and reuse it for the API port.
 *
 * Precedence:
 * 1. `EXPO_PUBLIC_API_URL` when it is not a loopback address (explicit override).
 * 2. Web: the browser's own hostname.
 * 3. Native: the Metro bundler host (`Constants.expoConfig.hostUri`).
 * 4. `EXPO_PUBLIC_API_URL` as-is, then the localhost default.
 */
function isLoopbackUrl(value: string): boolean {
  return /\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$)/.test(value);
}

function resolveApiBase(): string {
  const envBase = process.env.EXPO_PUBLIC_API_URL?.trim();
  const fallback = `http://localhost:${API_PORT}/api/v1`;

  if (envBase && !isLoopbackUrl(envBase)) {
    return envBase.replace(/\/+$/, "");
  }

  if (Platform.OS === "web") {
    const location = (
      globalThis as {
        location?: { hostname?: string; protocol?: string };
      }
    ).location;
    if (location?.hostname) {
      const protocol = location.protocol === "https:" ? "https:" : "http:";
      return `${protocol}//${location.hostname}:${API_PORT}/api/v1`;
    }
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    // Older/Expo Go manifests expose the debugger host instead.
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig
      ?.debuggerHost;

  const metroHost = hostUri?.split(":")[0];
  if (metroHost && metroHost !== "localhost" && metroHost !== "127.0.0.1") {
    return `http://${metroHost}:${API_PORT}/api/v1`;
  }

  return (envBase ?? fallback).replace(/\/+$/, "");
}

const API_BASE = resolveApiBase();

/** `api/src/middleware/auth.middleware.ts` — routes that skip authentication. */
const PUBLIC_PATHS = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/logout",
  "/auth/verify-email",
  "/auth/verify-email/resend",
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
      // Required on web (Expo web / browser) so the HTTP-only session cookie is
      // sent and stored for cross-origin API requests. Native React Native
      // networking carries cookies automatically regardless of this option.
      credentials: "include",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      `Could not reach the server at ${API_BASE}. Check that the API is running and that EXPO_PUBLIC_API_URL is reachable from this device.`
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
