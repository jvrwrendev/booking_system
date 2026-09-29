import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, onUnauthorized } from "@/lib/api-client";
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from "@/features/auth/services/auth.service";
import type { AuthUser } from "@/types/auth";
import { toAuthUser } from "@/features/users/lib/user-mapper";

/**
 * Session state for the API's cookie-based auth.
 *
 * The API issues an httpOnly `agrivet_token` cookie and never returns the JWT
 * to JavaScript, so there is nothing to persist in localStorage. On boot we ask
 * `GET /auth/me` who we are; the cookie decides the answer. A 401 anywhere in
 * the app tears down state through the `onUnauthorized` subscription.
 */

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => onUnauthorized(clearSession), [clearSession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { user: dto } = await getCurrentUser();
        if (!cancelled) setUser(toAuthUser(dto));
      } catch (error) {
        // A 401 here just means "no active session" — expected on a cold load
        // of /login. Anything else is a real problem worth surfacing.
        if (cancelled) return;
        if (!(error instanceof ApiError) || !error.isUnauthorized) {
          console.error("Failed to restore session:", error);
        }
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginRequest({ email, password });
      setUser(toAuthUser(result.user));
      return { success: true };
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "Login failed. Please try again." };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // The cookie is cleared regardless; a failed revoke must not trap the
      // user in a signed-in shell.
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user: dto } = await getCurrentUser();
      setUser(toAuthUser(dto));
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
