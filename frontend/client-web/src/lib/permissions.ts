export type Role = "SUPER_ADMIN" | "ADMIN";

export const ALL_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export type Permission =
  | "dashboard.view"
  | "products.view"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "categories.view"
  | "categories.create"
  | "categories.update"
  | "categories.delete"
  | "inventory.view"
  | "inventory.manage"
  | "bookings.view"
  | "bookings.create"
  | "bookings.update"
  | "bookings.delete"
  | "bookings.approve"
  | "bookings.assign"
  | "bookings.process"
  | "branch_orders.view"
  | "customers.view"
  | "customers.manage"
  | "agents.view"
  | "agents.manage"
  | "branches.view"
  | "branches.manage"
  | "users.view"
  | "users.manage"
  | "users.manage_roles"
  | "reports.view"
  | "settings.manage"
  | "settings.sensitive"
  | "audit_logs.view"
  | "roles.view"
  | "roles.manage";

export const ALL_PERMISSIONS: Permission[] = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.delete",
  "inventory.view",
  "inventory.manage",
  "bookings.view",
  "bookings.create",
  "bookings.update",
  "bookings.delete",
  "bookings.approve",
  "bookings.assign",
  "bookings.process",
  "branch_orders.view",
  "customers.view",
  "customers.manage",
  "agents.view",
  "agents.manage",
  "branches.view",
  "branches.manage",
  "users.view",
  "users.manage",
  "users.manage_roles",
  "reports.view",
  "settings.manage",
  "settings.sensitive",
  "audit_logs.view",
  "roles.view",
  "roles.manage",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "categories.view",
    "categories.create",
    "categories.update",
    "categories.delete",
    "inventory.view",
    "inventory.manage",
    "bookings.view",
    "bookings.create",
    "bookings.update",
    "bookings.delete",
    "bookings.approve",
    "bookings.assign",
    "bookings.process",
    "branch_orders.view",
    "customers.view",
    "customers.manage",
    "agents.view",
    "agents.manage",
    "branches.view",
    "branches.manage",
    "users.view",
    "users.manage",
    "users.manage_roles",
    "reports.view",
    "settings.manage",
    "settings.sensitive",
    "audit_logs.view",
    "roles.view",
    "roles.manage",
  ],
  ADMIN: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "categories.view",
    "categories.create",
    "categories.update",
    "categories.delete",
    "inventory.view",
    "inventory.manage",
    "bookings.view",
    "bookings.create",
    "bookings.update",
    "bookings.delete",
    "bookings.approve",
    "bookings.process",
    "customers.view",
    "customers.manage",
    "agents.view",
    "agents.manage",
    "branches.view",
    "branches.manage",
    "reports.view",
    "settings.manage",
  ],
};

export function hasPermission(
  role: Role | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: Role | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.some((p) => ROLE_PERMISSIONS[role].includes(p));
}

export function hasAllPermissions(
  role: Role | null | undefined,
  permissions: Permission[]
): boolean {
  if (!role) return false;
  return permissions.every((p) => ROLE_PERMISSIONS[role].includes(p));
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  SUPER_ADMIN: "Full system access including user management, audit logs, and sensitive settings.",
  ADMIN: "Operational management of inventory, bookings, customers, agents, and branches.",
};