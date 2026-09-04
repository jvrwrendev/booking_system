import { useEffect, useState } from "react";
import type { Permission, Role } from "@/lib/permissions";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";
import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user } = useAuth();
  const role: Role | null = user?.role ?? null;

  const can = (permission: Permission): boolean =>
    hasPermission(role, permission);

  const canAny = (permissions: Permission[]): boolean =>
    hasAnyPermission(role, permissions);

  const canAll = (permissions: Permission[]): boolean =>
    permissions.every((p) => hasPermission(role, p));

  return {
    role,
    can,
    canAny,
    canAll,
    isSuperAdmin: role === "SUPER_ADMIN",
    isAdmin: role === "ADMIN",
  };
}

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}