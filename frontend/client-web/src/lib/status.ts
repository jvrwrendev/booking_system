/**
 * Canonical status vocabulary.
 *
 * Every status label, badge variant and filter dropdown in the app is
 * derived from this module so the same status always reads the same way,
 * regardless of which module renders it.
 */

/** The badge treatments a status chip may use. */
export type StatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "muted"
  | "default"
  | "secondary"
  | "outline";

export type BookingStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "admin_accepted"
  | "confirmed"
  | "processing"
  | "ready"
  | "completed"
  | "ready_for_delivery"
  | "cancelled"
  | "rejected";

export type StockStatus = "in_stock" | "low_stock" | "critical" | "out_of_stock";

export type ProductStatus = "active" | "inactive" | "out_of_stock";

export type RecordStatus = "active" | "inactive" | "suspended";

export interface StatusOption {
  value: string;
  label: string;
}

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

/** `"ready_for_delivery"` -> `"Ready for delivery"`. */
export function humanize(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* Badge variants                                                             */
/* -------------------------------------------------------------------------- */

const BOOKING_STATUS_VARIANTS: Record<string, StatusVariant> = {
  pending: "warning",
  assigned: "warning",
  accepted: "info",
  admin_accepted: "info",
  confirmed: "info",
  processing: "info",
  ready: "info",
  completed: "success",
  ready_for_delivery: "success",
  cancelled: "destructive",
  rejected: "destructive",
};

const STOCK_STATUS_VARIANTS: Record<string, StatusVariant> = {
  in_stock: "success",
  low_stock: "warning",
  critical: "warning",
  out_of_stock: "destructive",
};

const PRODUCT_STATUS_VARIANTS: Record<string, StatusVariant> = {
  active: "success",
  inactive: "muted",
  out_of_stock: "destructive",
};

const RECORD_STATUS_VARIANTS: Record<string, StatusVariant> = {
  active: "success",
  inactive: "muted",
  suspended: "muted",
};

/**
 * Resolves a status string to its badge variant. Unknown values fall back to
 * a neutral chip rather than guessing a colour.
 */
export function getStatusVariant(status: string): StatusVariant {
  const key = status.toLowerCase();
  return (
    BOOKING_STATUS_VARIANTS[key] ??
    STOCK_STATUS_VARIANTS[key] ??
    PRODUCT_STATUS_VARIANTS[key] ??
    RECORD_STATUS_VARIANTS[key] ??
    "muted"
  );
}

/* -------------------------------------------------------------------------- */
/* Filter options                                                             */
/* -------------------------------------------------------------------------- */

/** Statuses an operator can filter a booking or order list by. */
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "assigned", label: "Assigned" },
  { value: "admin_accepted", label: "Admin accepted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "ready", label: "Ready" },
  { value: "ready_for_delivery", label: "Ready for delivery" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

export const STOCK_STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All stock levels" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "critical", label: "Critical" },
  { value: "out_of_stock", label: "Out of stock" },
];

export const PRODUCT_STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "out_of_stock", label: "Out of stock" },
];

export const RECORD_STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

/** The value that means "no filter applied" in every status dropdown. */
export const ALL_STATUS_VALUE = "all";
