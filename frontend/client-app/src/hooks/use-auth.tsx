import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onUnauthorized } from "@/lib/api-client";
import {
  changePasswordRequest,
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
  resendVerificationEmailRequest,
  updateAccountRequest,
  verifyEmailRequest,
} from "@/services/auth.service";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileInput,
} from "@/types/auth";
import { STORAGE_KEYS } from "@/constants";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loggedOut: boolean;
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string; code?: string }>;
  register: (
    credentials: RegisterCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  verifyEmail: (
    email: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;
  resendVerification: (
    email: string
  ) => Promise<{
    success: boolean;
    sent?: boolean;
    retryAfterSeconds?: number;
    expiresInSeconds?: number;
    error?: string;
  }>;
  updateProfile: (
    patch: UpdateProfileInput
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);

  const persistSession = useCallback(async (nextUser: AuthUser) => {
    setLoggedOut(false);
    setUser(nextUser);
    await AsyncStorage.setItem(
      STORAGE_KEYS.AUTH_USER,
      JSON.stringify(nextUser)
    );
  }, []);

  const clearSession = useCallback(async () => {
    setLoggedOut(true);
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }, []);

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      void clearSession();
    });
    return unsubscribe;
  }, [clearSession]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          // Legacy sessions may predate the `emailVerified` field. Default them
          // to verified (the backend still enforces verification on every
          // request) and let the refresh below supply the authoritative value.
          const restored: AuthUser = {
            ...parsed,
            emailVerified: parsed.emailVerified ?? true,
          };
          setUser(restored);
          // Validate the session cookie against the API in the background.
          // On 401 the onUnauthorized handler tears the session down; on
          // network failure the restored user is kept so the app stays usable.
          const fresh = await fetchCurrentUser(restored.id);
          if (fresh) {
            await persistSession(fresh);
          }
        }
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      } finally {
        setLoading(false);
      }
    })();
  }, [persistSession]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginRequest(credentials);
      if (result.success && result.user) {
        await persistSession(result.user);
        return { success: true };
      }
      return { success: false, error: result.error, code: result.code };
    },
    [persistSession]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await registerRequest(credentials);
      if (result.success && result.user) {
        // Registration no longer issues a session. The user must verify their
        // email before they can log in, so we do not persist a session here.
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    []
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      const result = await verifyEmailRequest(email, code);
      if (result.success) {
        // Verification does not create a session: the user signs in afterwards,
        // which sets the HTTP-only session cookie.
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    []
  );

  const resendVerification = useCallback(
    async (email: string) => {
      const result = await resendVerificationEmailRequest(email);
      return {
        success: result.success,
        sent: result.sent,
        retryAfterSeconds: result.retryAfterSeconds,
        expiresInSeconds: result.expiresInSeconds,
        error: result.error,
      };
    },
    []
  );

  const logout = useCallback(async () => {
    setLoggedOut(true);
    setUser(null);
    await Promise.all([
      logoutRequest(),
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER),
    ]);
  }, []);

  const updateProfile = useCallback(
    async (patch: UpdateProfileInput) => {
      if (!user) return { success: false, error: "No active session." };
      const result = await updateAccountRequest(user.id, patch);
      if (result.success && result.user) {
        await persistSession(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [user, persistSession]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user) return { success: false, error: "No active session." };
      const result = await changePasswordRequest(
        user.id,
        currentPassword,
        newPassword
      );
      if (!result.success) return { success: false, error: result.error };
      return { success: true };
    },
    [user]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (stored) setUser(JSON.parse(stored) as AuthUser);
    } catch {
      /* ignore */
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      loggedOut,
      login,
      register,
      verifyEmail,
      resendVerification,
      updateProfile,
      changePassword,
      logout,
      refresh,
    }),
    [
      user,
      isLoading,
      loggedOut,
      login,
      register,
      verifyEmail,
      resendVerification,
      updateProfile,
      changePassword,
      logout,
      refresh,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
