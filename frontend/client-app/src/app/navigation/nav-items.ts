import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Heart,
  ShoppingBag,
  Settings,
  Package,
} from "lucide-react-native";
import type { AgentTabParamList } from "./types";
import type { BranchTabParamList } from "./types";
import type { LucideIcon } from "lucide-react-native";

type AgentNavItem = {
  name: keyof AgentTabParamList;
  label: string;
  Icon: LucideIcon;
};

type BranchNavItem = {
  name: keyof BranchTabParamList;
  label: string;
  Icon: LucideIcon;
};

export const agentNavItems: AgentNavItem[] = [
  { name: "Dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { name: "Customers", label: "Customers", Icon: Users },
  { name: "Bookings", label: "Bookings", Icon: ClipboardList },
  { name: "Catalog", label: "Catalog", Icon: Package },
  { name: "Profile", label: "Settings", Icon: Settings },
];

export const branchNavItems: BranchNavItem[] = [
  { name: "Dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { name: "Catalog", label: "Catalog", Icon: Package },
  { name: "Favorites", label: "Favorites", Icon: Heart },
  { name: "Orders", label: "Orders", Icon: ShoppingBag },
  { name: "Profile", label: "Settings", Icon: Settings },
];
