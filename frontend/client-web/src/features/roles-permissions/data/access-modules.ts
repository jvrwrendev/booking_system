import {
  ClipboardList,
  FileBarChart,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

import type { Permission } from "@/lib/permissions";

export interface AccessModule {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
}

export const ACCESS_MODULES: AccessModule[] = [
  {
    key: "bookings",
    label: "Bookings",
    description: "View, create, update, approve, and assign customer bookings.",
    icon: ShoppingCart,
    permissions: [
      "bookings.view",
      "bookings.create",
      "bookings.update",
      "bookings.delete",
      "bookings.approve",
    ],
  },
  {
    key: "agent-orders",
    label: "Agent Orders",
    description: "View and act on agent orders from the Orders module.",
    icon: ClipboardList,
    permissions: ["bookings.view", "bookings.process"],
  },
  {
    key: "branch-orders",
    label: "Branch Orders",
    description: "View and act on branch orders.",
    icon: Store,
    permissions: ["branch_orders.view", "bookings.process"],
  },
  {
    key: "order-processing",
    label: "Order Processing",
    description: "Process assigned orders through to delivery.",
    icon: Package,
    permissions: ["bookings.process"],
  },
  {
    key: "user-management",
    label: "User Management",
    description: "View, create, and manage system users.",
    icon: Users,
    permissions: ["users.view", "users.manage"],
  },
  {
    key: "role-management",
    label: "Role & Permission Management",
    description: "View roles and grant or revoke permissions.",
    icon: ShieldCheck,
    permissions: ["roles.view", "roles.manage"],
  },
  {
    key: "reports",
    label: "Reports",
    description: "Generate and view analytics reports.",
    icon: FileBarChart,
    permissions: ["reports.view"],
  },
  {
    key: "settings",
    label: "Settings",
    description: "Manage system settings, including sensitive options.",
    icon: Settings,
    permissions: ["settings.manage", "settings.sensitive"],
  },
];