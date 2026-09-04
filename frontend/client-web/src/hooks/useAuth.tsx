import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockCredentials, mockUsers } from "@/data/mock-users";
import type { AuthUser } from "@/types/auth";

const STORAGE_KEY = "agrivet-auth-user";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await new Promise((r) => setTimeout(r, 400));
      const credential = mockCredentials.find(
        (c) =>
          c.email.toLowerCase() === email.trim().toLowerCase() &&
          c.password === password
      );
      if (!credential) {
        return {
          success: false,
          error: "Invalid email or password.",
        };
      }
      const found =
        mockUsers.find((u) => u.email === credential.email) ?? mockUsers[0];
      const loggedIn: AuthUser = {
        ...found,
        lastLogin: new Date().toISOString(),
      };
      setUser(loggedIn);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}