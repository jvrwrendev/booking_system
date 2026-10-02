import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loginRequest, registerRequest } from "@/services/auth.service";
import type {
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";
import { STORAGE_KEYS } from "@/constants";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    credentials: RegisterCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER);
        if (stored) {
          setUser(JSON.parse(stored) as AuthUser);
        }
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginRequest(credentials);
      if (result.success && result.user) {
        setUser(result.user);
        await AsyncStorage.setItem(
          STORAGE_KEYS.AUTH_USER,
          JSON.stringify(result.user),
        );
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await registerRequest(credentials);
      if (result.success && result.user) {
        setUser(result.user);
        await AsyncStorage.setItem(
          STORAGE_KEYS.AUTH_USER,
          JSON.stringify(result.user),
        );
        return { success: true };
      }
      return { success: false, error: result.error };
    },
    [],
  );

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  }, []);

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
      login,
      register,
      logout,
      refresh,
    }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
