import { Badge } from "@/components/ui/badge";

export type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "muted"
  | "default"
  | "secondary";

export function StatusBadge({
  label,
  variant = "muted",
}: {
  label: string;
  variant?: StatusVariant;
}) {
  return <Badge variant={variant}>{label}</Badge>;
}

export function getBookingStatusVariant(
  status: string
): StatusVariant {
  switch (status) {
    case "completed":
      return "success";
    case "assigned":
      return "warning";
    case "pending":
      return "warning";
    case "confirmed":
    case "accepted":
      return "info";
    case "processing":
      return "info";
    case "ready":
      return "info";
    case "cancelled":
    case "rejected":
      return "destructive";
    default:
      return "muted";
  }
}

export function getStockStatusVariant(
  status: string
): StatusVariant {
  switch (status) {
    case "in_stock":
      return "success";
    case "low_stock":
      return "warning";
    case "critical":
      return "warning";
    case "out_of_stock":
      return "destructive";
    default:
      return "muted";
  }
}

export function getStatusVariantFromGeneric(status: string): StatusVariant {
  if (status === "active" || status === "completed") return "success";
  if (status === "inactive" || status === "suspended") return "muted";
  if (status === "cancelled" || status === "rejected" || status === "out_of_stock")
    return "destructive";
  if (status === "pending") return "warning";
  return "default";
}

export function humanize(value: string): string {
  return value
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}