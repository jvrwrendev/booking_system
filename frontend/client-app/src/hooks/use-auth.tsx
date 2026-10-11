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
  googleSignInRequest,
  googleSignUpRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  updateAccountRequest,
} from "@/services/auth.service";
import type {
  AuthUser,
  GoogleProfile,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileInput,
} from "@/types/auth";
import type { Role } from "@/types/role";
import { STORAGE_KEYS } from "@/constants";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loggedOut: boolean;
  login: (
    credentials: LoginCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    credentials: RegisterCredentials
  ) => Promise<{ success: boolean; error?: string }>;
  googleSignIn: (
    profile: GoogleProfile
  ) => Promise<{ success: boolean; error?: string }>;
  googleSignUp: (
    profile: GoogleProfile,
    role: Role
  ) => Promise<{ success: boolean; error?: string }>;
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
          setUser(parsed);
          // Validate the session cookie against the API in the background.
          // On 401 the onUnauthorized handler tears the session down; on
          // network failure the restored user is kept so the app stays usable.
          const fresh = await fetchCurrentUser(parsed.id);
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
      return { success: false, error: result.error };
    },
    [persistSession]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await registerRequest(credentials);
      if (result.success && result.user) {
        await persistSession(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [persistSession]
  );

  const googleSignIn = useCallback(
    async (profile: GoogleProfile) => {
      const result = await googleSignInRequest(profile);
      if (result.success && result.user) {
        await persistSession(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [persistSession]
  );

  const googleSignUp = useCallback(
    async (profile: GoogleProfile, role: Role) => {
      const result = await googleSignUpRequest(profile, role);
      if (result.success && result.user) {
        await persistSession(result.user);
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [persistSession]
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
      googleSignIn,
      googleSignUp,
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
      googleSignIn,
      googleSignUp,
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
