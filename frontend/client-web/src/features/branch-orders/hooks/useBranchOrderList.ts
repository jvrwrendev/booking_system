import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";
import type { BranchOrder } from "@/types/branch-order";
import { listBranchOrders } from "../services/branch-orders.service";

export interface BranchOrderListFilters {
  status?: string;
  branchId?: string;
  assignedAdminId?: string;
  assignment?: "assigned" | "unassigned";
}

function messageFor(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Could not load branch orders. Please try again.";
}

/**
 * Server-driven branch-order list state. Search is debounced so typing does
 * not dispatch a request on every keystroke; filters and pagination are owned
 * by the API.
 */
export function useBranchOrderList(
  filters: BranchOrderListFilters,
  initialPageSize = 10,
) {
  const [branchOrders, setBranchOrders] = useState<BranchOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const requestId = useRef(0);
  const resetPending = useRef(false);

  const status = filters.status ?? "all";
  const branchId = filters.branchId ?? "all";
  const assignedAdminId = filters.assignedAdminId;
  const assignment = filters.assignment;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    resetPending.current = true;
    setPage(1);
  }, [status, branchId, assignedAdminId, assignment]);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const result = await listBranchOrders({
        page,
        pageSize,
        search: search || undefined,
        status,
        branchId,
        assignedAdminId,
        assignment,
      });
      if (currentRequest !== requestId.current) return;
      setBranchOrders(result.branchOrders);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(messageFor(err));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [
    page,
    pageSize,
    search,
    status,
    branchId,
    assignedAdminId,
    assignment,
  ]);

  useEffect(() => {
    // A filter change schedules a page reset. Wait for page 1 so an old page
    // request cannot race the refreshed list.
    if (resetPending.current && page !== 1) return;
    resetPending.current = false;
    void load();
  }, [load, page]);

  const changePageSize = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    branchOrders,
    total,
    loading,
    error,
    refresh: load,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
  };
}
