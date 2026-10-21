import { StatusBadge } from "@/components/common/StatusBadge";
import type { StatusVariant } from "@/lib/status";
import type { LocationStatus } from "../types";

/**
 * Single source of truth for how a location status reads.
 *
 * `dot` and `marker` are the same token so a status never looks like two
 * different colours in the legend, the list and on the map.
 */
export const LOCATION_STATUS_META: Record<
  LocationStatus,
  { label: string; short: string; variant: StatusVariant; dot: string }
> = {
  tracking: {
    label: "Tracking",
    short: "Tracking",
    variant: "success",
    dot: "bg-success",
  },
  offline: {
    label: "Offline",
    short: "Offline",
    variant: "warning",
    dot: "bg-warning",
  },
  location_unavailable: {
    label: "Location unavailable",
    short: "No fix",
    variant: "destructive",
    dot: "bg-destructive",
  },
};

export const LOCATION_STATUS_LABEL: Record<LocationStatus, string> = {
  tracking: LOCATION_STATUS_META.tracking.label,
  offline: LOCATION_STATUS_META.offline.label,
  location_unavailable: LOCATION_STATUS_META.location_unavailable.label,
};

export function getLocationStatusVariant(status: LocationStatus): StatusVariant {
  return LOCATION_STATUS_META[status].variant;
}

export function LocationStatusBadge({ status }: { status: LocationStatus }) {
  return (
    <StatusBadge
      variant={getLocationStatusVariant(status)}
      label={LOCATION_STATUS_META[status].short}
    />
  );
}

/** A small coloured dot for dense rows, legends and markers. */
export function LocationStatusDot({
  status,
  className,
}: {
  status: LocationStatus;
  className?: string;
}) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${LOCATION_STATUS_META[status].dot} ${className ?? ""}`}
      aria-hidden
    />
  );
}

/** Marker fill per status — same tokens as the dot. */
export const LOCATION_STATUS_MARKER_COLOR: Record<LocationStatus, string> = {
  tracking: "bg-primary",
  offline: "bg-warning",
  location_unavailable: "bg-destructive",
};
