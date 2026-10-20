import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ALL_PERMISSIONS,
  ALL_ROLES,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from "@/lib/permissions";

const STORAGE_KEY = "agrivet-role-permissions-v1";

type RolePermissionsMap = Record<Role, Permission[]>;

function defaultRolePermissions(): RolePermissionsMap {
  return ALL_ROLES.reduce(
    (acc, role) => {
      acc[role] = [...(ROLE_PERMISSIONS[role] ?? [])];
      return acc;
    },
    {} as RolePermissionsMap
  );
}

function loadRolePermissions(): RolePermissionsMap {
  const base = defaultRolePermissions();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RolePermissionsMap>;
      for (const role of ALL_ROLES) {
        const stored = parsed?.[role];
        if (Array.isArray(stored)) {
          base[role] = stored.filter(
            (p): p is Permission => ALL_PERMISSIONS.includes(p as Permission)
          );
        }
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return base;
}

interface RolesPermissionsContextValue {
  rolePermissions: RolePermissionsMap;
  getRolePermissions: (role: Role | null | undefined) => Permission[];
  grant: (role: Role, permission: Permission) => void;
  revoke: (role: Role, permission: Permission) => void;
  setModule: (role: Role, permissions: Permission[], enabled: boolean) => void;
  resetRole: (role: Role) => void;
}

const RolesPermissionsContext =
  createContext<RolesPermissionsContextValue | null>(null);

export function RolesPermissionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [rolePermissions, setRolePermissions] =
    useState<RolePermissionsMap>(loadRolePermissions);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rolePermissions));
    } catch {
      // Ignore quota/availability errors; state remains in-memory.
    }
  }, [rolePermissions]);

  const getRolePermissions = useCallback(
    (role: Role | null | undefined): Permission[] =>
      role ? rolePermissions[role] ?? [] : [],
    [rolePermissions]
  );

  const grant = useCallback((role: Role, permission: Permission) => {
    setRolePermissions((prev) => {
      const current = prev[role] ?? [];
      if (current.includes(permission)) return prev;
      return { ...prev, [role]: [...current, permission] };
    });
  }, []);

  const revoke = useCallback((role: Role, permission: Permission) => {
    setRolePermissions((prev) => {
      const current = prev[role] ?? [];
      if (!current.includes(permission)) return prev;
      return {
        ...prev,
        [role]: current.filter((p) => p !== permission),
      };
    });
  }, []);

  const setModule = useCallback(
    (role: Role, permissions: Permission[], enabled: boolean) => {
      setRolePermissions((prev) => {
        const current = new Set(prev[role] ?? []);
        permissions.forEach((p) => {
          if (enabled) current.add(p);
          else current.delete(p);
        });
        return { ...prev, [role]: [...current] };
      });
    },
    []
  );

  const resetRole = useCallback((role: Role) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: [...(ROLE_PERMISSIONS[role] ?? [])],
    }));
  }, []);

  const value = useMemo<RolesPermissionsContextValue>(
    () => ({
      rolePermissions,
      getRolePermissions,
      grant,
      revoke,
      setModule,
      resetRole,
    }),
    [rolePermissions, getRolePermissions, grant, revoke, setModule, resetRole]
  );

  return (
    <RolesPermissionsContext.Provider value={value}>
      {children}
    </RolesPermissionsContext.Provider>
  );
}

export function useRolesPermissionsStore() {
  const ctx = useContext(RolesPermissionsContext);
  if (!ctx) {
    throw new Error(
      "useRolesPermissionsStore must be used within RolesPermissionsProvider"
    );
  }
  return ctx;
}