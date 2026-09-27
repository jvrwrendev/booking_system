import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Package,
  Tags,
  Users as UsersIcon,
  UserCog,
  MapPinned,
  Building2,
  FileBarChart,
  History,
  Settings,
  ShieldCheck,
  Leaf,
  ClipboardList,
  KeyRound,
  Radio,
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
        title: "Live Tracking",
        href: "/tracking",
        icon: Radio,
        permission: "bookings.view",
        end: true,
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
        title: "Location Tracking",
        href: "/agents/location",
        icon: MapPinned,
        permission: "agents.view",
        end: true,
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
        title: "Roles & Permissions",
        href: "/roles",
        icon: KeyRound,
        permission: "roles.view",
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