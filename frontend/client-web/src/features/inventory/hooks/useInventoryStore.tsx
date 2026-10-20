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

import { ApiError } from "@/lib/api-client";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";
import { useDebounce } from "@/hooks/usePermissions";
import type {
  InventoryBranch,
  InventoryItem,
  InventorySummary,
  InventoryTransaction,
} from "@/types/inventory";
import {
  adjustStock as adjustStockRequest,
  getInventorySummary,
  listInventory,
  listInventoryBranches,
  listInventoryTransactions,
  stockIn as stockInRequest,
  stockOut as stockOutRequest,
  toInventoryItem,
  toInventoryTransaction,
  transferStock as transferStockRequest,
} from "../services/inventory.service";

export interface InventoryFilters {
  search: string;
  categoryId: string;
  branchId: string;
  status: string;
}

export interface TransactionFilters {
  search: string;
  type: string;
  branchId: string;
}

interface InventoryContextValue {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: InventoryFilters;
  summary: InventorySummary;
  summaryLoading: boolean;
  summaryError: string | null;
  branches: InventoryBranch[];
  transactions: InventoryTransaction[];
  transactionTotal: number;
  transactionPage: number;
  transactionPageSize: number;
  transactionTotalPages: number;
  transactionLoading: boolean;
  transactionError: string | null;
  transactionFilters: TransactionFilters;
  setSearch: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setBranchFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  refresh: () => Promise<void>;
  setTransactionSearch: (value: string) => void;
  setTransactionTypeFilter: (value: string) => void;
  setTransactionBranchFilter: (value: string) => void;
  setTransactionPage: (value: number) => void;
  setTransactionPageSize: (value: number) => void;
  refreshTransactions: () => Promise<void>;
  stockIn: (
    productId: string,
    branchId: string,
    quantity: number,
    reason?: string,
  ) => Promise<void>;
  stockOut: (
    productId: string,
    branchId: string,
    quantity: number,
    reason?: string,
  ) => Promise<void>;
  adjustStock: (
    productId: string,
    branchId: string,
    quantity: number,
    reason: string,
  ) => Promise<void>;
  transferStock: (
    productId: string,
    fromBranchId: string,
    toBranchId: string,
    quantity: number,
    reason?: string,
  ) => Promise<void>;
}

const EMPTY_SUMMARY: InventorySummary = {
  totalProducts: 0,
  totalUnits: 0,
  inventoryValue: 0,
  lowStockCount: 0,
  criticalCount: 0,
  outOfStockCount: 0,
  alerts: [],
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

const INITIAL_FILTERS: InventoryFilters = {
  search: "",
  categoryId: "all",
  branchId: "all",
  status: "all",
};

const INITIAL_TRANSACTION_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  branchId: "all",
};

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(INITIAL_FILTERS);

  const [summary, setSummary] = useState<InventorySummary>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [branches, setBranches] = useState<InventoryBranch[]>([]);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPageSize, setTransactionPageSize] =
    useState(PAGE_SIZE_DEFAULT);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionFilters, setTransactionFilters] =
    useState<TransactionFilters>(INITIAL_TRANSACTION_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedTransactionSearch = useDebounce(
    transactionFilters.search,
    300,
  );

  const load = useCallback(
    async (nextPage: number, overridePageSize?: number) => {
      const size = overridePageSize ?? pageSize;
      setLoading(true);
      setError(null);
      try {
        const result = await listInventory({
          page: nextPage,
          pageSize: size,
          search: debouncedSearch || undefined,
          categoryId: filters.categoryId,
          branchId: filters.branchId,
          status: filters.status,
          sortBy: "productName",
          sortOrder: "asc",
        });
        setItems(result.items.map(toInventoryItem));
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(messageFor(err, "Could not load inventory."));
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [
      pageSize,
      debouncedSearch,
      filters.categoryId,
      filters.branchId,
      filters.status,
    ],
  );

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      setSummary(await getInventorySummary(filters.branchId));
    } catch (err) {
      setSummaryError(messageFor(err, "Could not load inventory summary."));
    } finally {
      setSummaryLoading(false);
    }
  }, [filters.branchId]);

  const loadTransactions = useCallback(
    async (nextPage: number, overridePageSize?: number) => {
      const size = overridePageSize ?? transactionPageSize;
      setTransactionLoading(true);
      setTransactionError(null);
      try {
        const result = await listInventoryTransactions({
          page: nextPage,
          pageSize: size,
          search: debouncedTransactionSearch || undefined,
          type: transactionFilters.type,
          branchId: transactionFilters.branchId,
        });
        setTransactions(result.transactions.map(toInventoryTransaction));
        setTransactionTotal(result.total);
        setTransactionPage(result.page);
        setTransactionPageSize(result.pageSize);
        setTransactionTotalPages(result.totalPages);
      } catch (err) {
        setTransactionError(messageFor(err, "Could not load transactions."));
        setTransactions([]);
        setTransactionTotal(0);
      } finally {
        setTransactionLoading(false);
      }
    },
    [
      transactionPageSize,
      debouncedTransactionSearch,
      transactionFilters.type,
      transactionFilters.branchId,
    ],
  );

  useEffect(() => {
    void load(page, pageSize);
  }, [
    debouncedSearch,
    filters.categoryId,
    filters.branchId,
    filters.status,
    page,
    pageSize,
    load,
  ]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadTransactions(transactionPage, transactionPageSize);
  }, [
    debouncedTransactionSearch,
    transactionFilters.type,
    transactionFilters.branchId,
    transactionPage,
    transactionPageSize,
    loadTransactions,
  ]);

  useEffect(() => {
    listInventoryBranches()
      .then(setBranches)
      .catch((err) => {
        toast.error("Could not load branches", {
          description: messageFor(err, "Please try again."),
        });
      });
  }, []);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  const setCategoryFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, categoryId: value }));
    setPage(1);
  }, []);

  const setBranchFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, branchId: value }));
    setPage(1);
  }, []);

  const setStatusFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPage(1);
  }, []);

  const changePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(1);
  }, []);

  const setTransactionSearch = useCallback((value: string) => {
    setTransactionFilters((prev) => ({ ...prev, search: value }));
    setTransactionPage(1);
  }, []);

  const setTransactionTypeFilter = useCallback((value: string) => {
    setTransactionFilters((prev) => ({ ...prev, type: value }));
    setTransactionPage(1);
  }, []);

  const setTransactionBranchFilter = useCallback((value: string) => {
    setTransactionFilters((prev) => ({ ...prev, branchId: value }));
    setTransactionPage(1);
  }, []);

  const changeTransactionPageSize = useCallback((value: number) => {
    setTransactionPageSize(value);
    setTransactionPage(1);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      load(page, pageSize),
      loadSummary(),
      loadTransactions(transactionPage, transactionPageSize),
    ]);
  }, [load, page, pageSize, loadSummary, loadTransactions, transactionPage, transactionPageSize]);

  const refreshTransactions = useCallback(
    () => loadTransactions(transactionPage, transactionPageSize),
    [loadTransactions, transactionPage, transactionPageSize],
  );

  const stockIn = useCallback(
    async (productId: string, branchId: string, quantity: number, reason?: string) => {
      try {
        await stockInRequest({ productId, branchId, quantity, reason });
        toast.success("Stock added", {
          description: `${quantity} unit(s) received.`,
        });
        await refresh();
      } catch (err) {
        toast.error("Could not add stock", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [refresh],
  );

  const stockOut = useCallback(
    async (productId: string, branchId: string, quantity: number, reason?: string) => {
      try {
        await stockOutRequest({ productId, branchId, quantity, reason });
        toast.success("Stock removed", {
          description: `${quantity} unit(s) issued.`,
        });
        await refresh();
      } catch (err) {
        toast.error("Could not remove stock", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [refresh],
  );

  const adjustStock = useCallback(
    async (
      productId: string,
      branchId: string,
      quantity: number,
      reason: string,
    ) => {
      try {
        await adjustStockRequest({ productId, branchId, quantity, reason });
        toast.success("Stock adjusted", {
          description: `Adjustment of ${quantity > 0 ? "+" : ""}${quantity} recorded.`,
        });
        await refresh();
      } catch (err) {
        toast.error("Could not adjust stock", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [refresh],
  );

  const transferStock = useCallback(
    async (
      productId: string,
      fromBranchId: string,
      toBranchId: string,
      quantity: number,
      reason?: string,
    ) => {
      try {
        await transferStockRequest({
          productId,
          fromBranchId,
          toBranchId,
          quantity,
          reason,
        });
        toast.success("Stock transferred", {
          description: `${quantity} unit(s) moved between branches.`,
        });
        await refresh();
      } catch (err) {
        toast.error("Could not transfer stock", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [refresh],
  );

  const value = useMemo<InventoryContextValue>(
    () => ({
      items,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      summary,
      summaryLoading,
      summaryError,
      branches,
      transactions,
      transactionTotal,
      transactionPage,
      transactionPageSize,
      transactionTotalPages,
      transactionLoading,
      transactionError,
      transactionFilters,
      setSearch,
      setCategoryFilter,
      setBranchFilter,
      setStatusFilter,
      setPage,
      setPageSize: changePageSize,
      refresh,
      setTransactionSearch,
      setTransactionTypeFilter,
      setTransactionBranchFilter,
      setTransactionPage,
      setTransactionPageSize: changeTransactionPageSize,
      refreshTransactions,
      stockIn,
      stockOut,
      adjustStock,
      transferStock,
    }),
    [
      items,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      summary,
      summaryLoading,
      summaryError,
      branches,
      transactions,
      transactionTotal,
      transactionPage,
      transactionPageSize,
      transactionTotalPages,
      transactionLoading,
      transactionError,
      transactionFilters,
      setSearch,
      setCategoryFilter,
      setBranchFilter,
      setStatusFilter,
      refresh,
      setTransactionSearch,
      setTransactionTypeFilter,
      setTransactionBranchFilter,
      refreshTransactions,
      stockIn,
      stockOut,
      adjustStock,
      transferStock,
      changePageSize,
      changeTransactionPageSize,
    ],
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryStore() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventoryStore must be used within InventoryProvider");
  }
  return context;
}
