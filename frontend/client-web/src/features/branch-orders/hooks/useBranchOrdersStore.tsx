import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { AuthUser } from "@/types/auth";
import type { BranchOrder, BranchOrderStatus } from "@/types/branch-order";
import { ApiError } from "@/lib/api-client";
import { humanize } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import {
  applyBranchOrderDiscount,
  assignBranchOrder as assignBranchOrderRequest,
  getBranchOrder,
  listBranchOrders,
  unassignBranchOrder as unassignBranchOrderRequest,
  updateBranchOrderStatus,
} from "../services/branch-orders.service";

interface BranchOrdersContextValue {
  orders: BranchOrder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getOrder: (id: string) => BranchOrder | undefined;
  loadOrder: (id: string) => Promise<BranchOrder | undefined>;
  removeOrder: (id: string) => void;
  setStatus: (
    id: string,
    status: BranchOrderStatus,
    by?: Pick<AuthUser, "id" | "fullName">,
  ) => Promise<void>;
  assignOrder: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">,
  ) => Promise<void>;
  reassignOrder: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">,
  ) => Promise<void>;
  unassignOrder: (id: string) => Promise<void>;
  applyDiscount: (
    id: string,
    discount: number,
    by?: Pick<AuthUser, "id" | "fullName">,
    note?: string,
  ) => Promise<void>;
}

const BranchOrdersContext = createContext<BranchOrdersContextValue | null>(
  null,
);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function BranchOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedIds = useRef(new Set<string>());

  const upsert = useCallback((order: BranchOrder) => {
    setOrders((prev) => {
      const index = prev.findIndex((item) => item.id === order.id);
      if (index === -1) return [order, ...prev];
      const next = [...prev];
      next[index] = order;
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listBranchOrders({
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setOrders((previous) => {
        const byId = new Map(previous.map((order) => [order.id, order]));
        const listIds = new Set(result.branchOrders.map((order) => order.id));
        const merged = result.branchOrders.map((order) => {
          const cached = byId.get(order.id);
          if (!cached) return order;
          return new Date(order.updatedAt ?? order.createdAt) >=
            new Date(cached.updatedAt ?? cached.createdAt)
            ? order
            : cached;
        });
        // Keep orders opened by direct link even when they fall outside the
        // most recent 100 records returned by the list endpoint.
        for (const order of previous) {
          if (!listIds.has(order.id) && loadedIds.current.has(order.id)) {
            merged.push(order);
          }
        }
        return merged.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Could not load branch orders."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadOrder = useCallback(
    async (id: string) => {
      try {
        const order = await getBranchOrder(id);
        loadedIds.current.add(id);
        upsert(order);
        return order;
      } catch (err) {
        if (!(err instanceof ApiError && err.isUnauthorized)) {
          toast.error("Could not load branch order", {
            description: errorMessage(err, "Please try again."),
          });
        }
        return undefined;
      }
    },
    [upsert],
  );

  const removeOrder = useCallback((id: string) => {
    loadedIds.current.delete(id);
    setOrders((previous) => previous.filter((order) => order.id !== id));
  }, []);

  const setStatus = useCallback(
    async (
      id: string,
      status: BranchOrderStatus,
      _by?: Pick<AuthUser, "id" | "fullName">,
    ) => {
      try {
        const order = await updateBranchOrderStatus(id, status);
        upsert(order);
        toast.success("Branch order status updated", {
          description: `Order marked as ${humanize(status)}.`,
        });
      } catch (err) {
        toast.error("Could not update branch order status", {
          description: errorMessage(
            err,
            "The branch order status was not changed.",
          ),
        });
      }
    },
    [upsert],
  );

  const assign = useCallback(
    async (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      _by: Pick<AuthUser, "id" | "fullName">,
    ) => {
      try {
        const order = await assignBranchOrderRequest(id, {
          adminId: admin.id,
        });
        upsert(order);
        toast.success("Order assigned", {
          description: `Order assigned to ${admin.fullName}.`,
        });
      } catch (err) {
        toast.error("Could not assign order", {
          description: errorMessage(err, "Please try again."),
        });
      }
    },
    [upsert],
  );

  const reassignOrder = useCallback(
    async (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      by: Pick<AuthUser, "id" | "fullName">,
    ) => {
      try {
        const order = await assignBranchOrderRequest(id, {
          adminId: admin.id,
        });
        upsert(order);
        toast.success("Order reassigned", {
          description: `Order reassigned to ${admin.fullName}.`,
        });
      } catch (err) {
        toast.error("Could not reassign order", {
          description: errorMessage(err, "Please try again."),
        });
      }
      void by;
    },
    [upsert],
  );

  const unassignOrder = useCallback(
    async (id: string) => {
      try {
        const order = await unassignBranchOrderRequest(id);
        upsert(order);
        toast.success("Assignment removed", {
          description: "Branch order is now unassigned.",
        });
      } catch (err) {
        toast.error("Could not remove assignment", {
          description: errorMessage(err, "Please try again."),
        });
      }
    },
    [upsert],
  );

  const applyDiscount = useCallback(
    async (
      id: string,
      discount: number,
      _by?: Pick<AuthUser, "id" | "fullName">,
      note?: string,
    ) => {
      try {
        const order = await applyBranchOrderDiscount(id, { discount, note });
        upsert(order);
        toast.success("Discount updated", {
          description:
            discount === 0
              ? "Discount removed from the order."
              : `Discount of ${formatCurrency(discount)} applied.`,
        });
      } catch (err) {
        toast.error("Could not update discount", {
          description: errorMessage(err, "Please try again."),
        });
      }
    },
    [upsert],
  );

  const value = useMemo<BranchOrdersContextValue>(
    () => ({
      orders,
      loading,
      error,
      refresh,
      getOrder: (id) => orders.find((order) => order.id === id),
      loadOrder,
      removeOrder,
      setStatus,
      assignOrder: assign,
      reassignOrder,
      unassignOrder,
      applyDiscount,
    }),
    [
      orders,
      loading,
      error,
      refresh,
      loadOrder,
      removeOrder,
      setStatus,
      assign,
      reassignOrder,
      unassignOrder,
      applyDiscount,
    ],
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
      "useBranchOrdersStore must be used within BranchOrdersProvider",
    );
  }
  return ctx;
}
