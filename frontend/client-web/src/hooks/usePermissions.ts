import { useEffect, useState } from "react";
import type { Permission, Role } from "@/lib/permissions";
import { useAuth } from "./useAuth";
import { useRolesPermissionsStore } from "@/features/roles-permissions/hooks/useRolesPermissionsStore";

export function usePermissions() {
  const { user } = useAuth();
  const { getRolePermissions } = useRolesPermissionsStore();
  const role: Role | null = user?.role ?? null;
  const permissions = getRolePermissions(role);

  const can = (permission: Permission): boolean =>
    !!role && permissions.includes(permission);

  const canAny = (allowed: Permission[]): boolean =>
    !!role && allowed.some((p) => permissions.includes(p));

  const canAll = (allowed: Permission[]): boolean =>
    !!role && allowed.every((p) => permissions.includes(p));

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