import { useMemo } from "react";
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import type { Booking } from "@/types/booking";
import type { BranchOrder } from "@/types/branch-order";

export const ACTIVE_AGENT_STATUSES = [
  "assigned",
  "accepted",
  "confirmed",
  "processing",
  "ready",
];

export const ACTIVE_BRANCH_STATUSES = [
  "assigned",
  "accepted",
  "processing",
  "ready",
];

export function useMyOrders() {
  const { user } = useAuth();
  const { bookings } = useBookingsStore();
  const { orders } = useBranchOrdersStore();

  const myAgentOrders = useMemo<Booking[]>(
    () =>
      bookings.filter((b) => !!b.assignedAdminId && b.assignedAdminId === user?.id),
    [bookings, user?.id]
  );

  const myBranchOrders = useMemo<BranchOrder[]>(
    () =>
      orders.filter((o) => !!o.assignedAdminId && o.assignedAdminId === user?.id),
    [orders, user?.id]
  );

  const activeCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.assignedAdminId === user?.id &&
          ACTIVE_AGENT_STATUSES.includes(b.status)
      ).length +
      orders.filter(
        (o) =>
          o.assignedAdminId === user?.id &&
          ACTIVE_BRANCH_STATUSES.includes(o.status)
      ).length,
    [bookings, orders, user?.id]
  );

  return { myAgentOrders, myBranchOrders, activeCount };
}