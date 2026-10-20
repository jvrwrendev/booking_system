import React from "react";
import { Badge } from "@/components/ui/badge";
import { humanizeStatus } from "@/types/status";
import type { BookingStatus } from "@/types/booking";
import type { BranchOrderStatus } from "@/types/branch-order";

export type TransactionStatusLike =
  | BookingStatus
  | BranchOrderStatus
  | string;

function toneFor(status: string) {
  switch (status) {
    case "pending":
    case "PENDING":
      return "warning" as const;
    case "accepted":
    case "ACCEPTED":
    case "processing":
    case "PROCESSING":
      return "info" as const;
    case "assigned":
    case "ASSIGNED":
      return "primary" as const;
    case "ready":
    case "READY":
      return "info" as const;
    case "completed":
    case "COMPLETED":
      return "success" as const;
    case "cancelled":
    case "rejected":
    case "CANCELLED":
    case "REJECTED":
      return "danger" as const;
    default:
      return "muted" as const;
  }
}

interface StatusBadgeProps {
  status: TransactionStatusLike;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      label={humanizeStatus(status)}
      tone={toneFor(status)}
      variant="subtle"
      className={className}
    />
  );
}
