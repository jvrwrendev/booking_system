import {
  StatusBadge,
  type StatusVariant,
} from "@/components/common/StatusBadge";
import type { LocationStatus } from "../types";

export function getLocationStatusVariant(status: LocationStatus): StatusVariant {
  switch (status) {
    case "tracking":
      return "success";
    case "offline":
      return "warning";
    case "location_unavailable":
      return "destructive";
    default:
      return "muted";
  }
}

export const LOCATION_STATUS_LABEL: Record<LocationStatus, string> = {
  tracking: "Tracking",
  offline: "Offline",
  location_unavailable: "Location Unavailable",
};

export function LocationStatusBadge({ status }: { status: LocationStatus }) {
  return (
    <StatusBadge
      variant={getLocationStatusVariant(status)}
      label={LOCATION_STATUS_LABEL[status]}
    />
  );
}

/** Tailwind text colour per status, used to tint map markers. */
export const LOCATION_STATUS_MARKER_COLOR: Record<LocationStatus, string> = {
  tracking: "bg-primary",
  offline: "bg-muted-foreground",
  location_unavailable: "bg-destructive",
};
