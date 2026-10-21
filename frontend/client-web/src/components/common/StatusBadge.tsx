import { Badge } from "@/components/ui/badge";
import {
  getStatusVariant,
  humanize,
  type StatusVariant,
} from "@/lib/status";

/**
 * Status chip used across every module.
 *
 * The variant mapping itself lives in `@/lib/status` so that all modules
 * resolve a given status to the same colour.
 */
export function StatusBadge({
  label,
  variant = "muted",
}: {
  label: string;
  variant?: StatusVariant;
}) {
  return <Badge variant={variant}>{label}</Badge>;
}

export type { StatusVariant };
export { getStatusVariant, humanize };

/* Legacy aliases kept so existing call sites keep working while they are
 * migrated to the unified `getStatusVariant` helper. */
export const getBookingStatusVariant = getStatusVariant;
export const getBranchOrderStatusVariant = getStatusVariant;
export const getStockStatusVariant = getStatusVariant;
export const getStatusVariantFromGeneric = getStatusVariant;
