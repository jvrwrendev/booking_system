import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Package,
  Tags,
  Users as UsersIcon,
  UserCog,
  Building2,
  FileBarChart,
  History,
  Settings,
  ShieldCheck,
  Leaf,
  UserCheck,
  ClipboardList,
  Store,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: Permission;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Bookings",
        href: "/bookings",
        icon: ShoppingCart,
        permission: "bookings.view",
        end: true,
      },
      {
        title: "Orders",
        href: "/orders",
        icon: ClipboardList,
        permission: "bookings.process",
        end: true,
      },
      {
        title: "Branch Orders",
        href: "/branch-orders",
        icon: Store,
        permission: "branch_orders.view",
        end: true,
      },
      {
        title: "Assign Booking",
        href: "/bookings/assign",
        icon: UserCheck,
        permission: "bookings.assign",
      },
      {
        title: "Inventory",
        href: "/inventory",
        icon: Boxes,
        permission: "inventory.view",
      },
      {
        title: "Products",
        href: "/products",
        icon: Package,
        permission: "products.view",
      },
      {
        title: "Categories",
        href: "/categories",
        icon: Tags,
        permission: "categories.view",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Customers",
        href: "/customers",
        icon: UsersIcon,
        permission: "customers.view",
      },
      {
        title: "Agents",
        href: "/agents",
        icon: UserCog,
        permission: "agents.view",
      },
      {
        title: "Branches",
        href: "/branches",
        icon: Building2,
        permission: "branches.view",
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Reports",
        href: "/reports",
        icon: FileBarChart,
        permission: "reports.view",
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: ShieldCheck,
        permission: "users.view",
      },
      {
        title: "Audit Logs",
        href: "/audit-logs",
        icon: History,
        permission: "audit_logs.view",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        permission: "settings.manage",
      },
    ],
  },
];

export const brandIcon = Leaf;