import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockBranchOrders } from "@/data/mock-branch-orders";
import type { AuthUser } from "@/types/auth";
import type { BranchOrder, BranchOrderStatus } from "@/types/branch-order";
import type { StatusHistoryEntry } from "@/types/order-history";
import { humanize } from "@/components/common/StatusBadge";

const STORAGE_KEY = "agrivet-branch-orders-v2";

function historyEntry(
  from: string,
  to: string,
  by?: Pick<AuthUser, "id" | "fullName">,
  label?: string
): StatusHistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    label: label ?? humanize(to),
    timestamp: new Date().toISOString(),
    by: by?.fullName ?? "System",
  };
}

interface BranchOrdersContextValue {
  orders: BranchOrder[];
  getOrder: (id: string) => BranchOrder | undefined;
  setStatus: (
    id: string,
    status: BranchOrderStatus,
    by?: Pick<AuthUser, "id" | "fullName">
  ) => void;
  assignOrder: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">
  ) => void;
  reassignOrder: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">
  ) => void;
}

function loadBranchOrders(): BranchOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as BranchOrder[];
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return mockBranchOrders;
}

const BranchOrdersContext = createContext<BranchOrdersContextValue | null>(
  null
);

export function BranchOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<BranchOrder[]>(loadBranchOrders);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Ignore quota/availability errors; state remains in-memory.
    }
  }, [orders]);

  const setStatus = useCallback(
    (
      id: string,
      status: BranchOrderStatus,
      by?: Pick<AuthUser, "id" | "fullName">
    ) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          return {
            ...o,
            status,
            statusHistory: [
              ...(o.statusHistory ?? []),
              historyEntry(o.status, status, by),
            ],
          };
        })
      );
      toast.success("Branch order status updated", {
        description: `Order marked as ${humanize(status)}.`,
      });
    },
    []
  );

  const assignOrder = useCallback(
    (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      by: Pick<AuthUser, "id" | "fullName">
    ) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                assignedAdminId: admin.id,
                assignedAdminName: admin.fullName,
                assignedById: by.id,
                assignedByName: by.fullName,
                assignmentDate: new Date().toISOString(),
                status:
                  o.status === "pending" || o.status === "accepted"
                    ? "assigned"
                    : o.status,
                statusHistory: [
                  ...(o.statusHistory ?? []),
                  historyEntry(o.status, "assigned", by),
                ],
              }
            : o
        )
      );
      toast.success("Order assigned", {
        description: `Order assigned to ${admin.fullName}.`,
      });
    },
    []
  );

  const reassignOrder = useCallback(
    (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      by: Pick<AuthUser, "id" | "fullName">
    ) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                assignedAdminId: admin.id,
                assignedAdminName: admin.fullName,
                assignedById: by.id,
                assignedByName: by.fullName,
                assignmentDate: new Date().toISOString(),
                statusHistory: [
                  ...(o.statusHistory ?? []),
                  historyEntry("assigned", "assigned", by),
                ],
              }
            : o
        )
      );
      toast.success("Order reassigned", {
        description: `Order reassigned to ${admin.fullName}.`,
      });
    },
    []
  );

  const value = useMemo<BranchOrdersContextValue>(
    () => ({
      orders,
      getOrder: (id) => orders.find((o) => o.id === id),
      setStatus,
      assignOrder,
      reassignOrder,
    }),
    [orders, setStatus, assignOrder, reassignOrder]
  );

  return (
    <BranchOrdersContext.Provider value={value}>
      {children}
    </BranchOrdersContext.Provider>
  );
}

export function useBranchOrdersStore() {
  const ctx = useContext(BranchOrdersContext);
  if (!ctx) {
    throw new Error(
      "useBranchOrdersStore must be used within BranchOrdersProvider"
    );
  }
  return ctx;
}