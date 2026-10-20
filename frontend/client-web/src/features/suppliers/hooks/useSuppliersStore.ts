import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";
import { useDebounce } from "@/hooks/usePermissions";
import type { Supplier, SupplierFormValues } from "@/types/supplier";
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
} from "../services/suppliers.service";

export interface SupplierFilters {
  search: string;
  status: string;
}

export function useSuppliersStore() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupplierFilters>({
    search: "",
    status: "all",
  });

  const debouncedSearch = useDebounce(filters.search, 300);

  const load = useCallback(
    async (nextPage: number, overridePageSize?: number) => {
      const size = overridePageSize ?? pageSize;
      setLoading(true);
      setError(null);
      try {
        const result = await listSuppliers({
          page: nextPage,
          pageSize: size,
          search: debouncedSearch || undefined,
          status:
            filters.status === "active"
              ? "ACTIVE"
              : filters.status === "inactive"
                ? "INACTIVE"
                : undefined,
          sortBy: "name",
          sortOrder: "asc",
        });
        setSuppliers(result.suppliers);
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load suppliers.",
        );
        setSuppliers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, debouncedSearch, filters.status],
  );

  useEffect(() => {
    void load(page, pageSize);
  }, [debouncedSearch, filters.status, page, pageSize, load]);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
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

  const refresh = useCallback(() => load(page, pageSize), [load, page, pageSize]);

  const addSupplier = useCallback(
    async (values: SupplierFormValues) => {
      try {
        const created = await createSupplier(values);
        toast.success("Supplier created", {
          description: `${created.name} is now available for products.`,
        });
        if (page !== 1) setPage(1);
        else await load(1, pageSize);
        return created;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          err instanceof ApiError
            ? err.message
            : "Could not create the supplier.",
        );
      }
    },
    [page, pageSize, load],
  );

  const editSupplier = useCallback(
    async (id: string, values: SupplierFormValues) => {
      try {
        const updated = await updateSupplier(id, values);
        toast.success("Supplier updated", {
          description: `${updated.name} was saved.`,
        });
        await load(page, pageSize);
        return updated;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          err instanceof ApiError
            ? err.message
            : "Could not save the supplier.",
        );
      }
    },
    [page, pageSize, load],
  );

  const removeSupplier = useCallback(
    async (id: string) => {
      try {
        await deleteSupplier(id);
        toast.success("Supplier deleted");
        const remaining = suppliers.length - 1;
        const nextPage = remaining === 0 && page > 1 ? page - 1 : page;
        await load(nextPage, pageSize);
      } catch (err) {
        toast.error("Could not delete supplier", {
          description:
            err instanceof ApiError ? err.message : "Please try again.",
        });
        throw err;
      }
    },
    [suppliers.length, page, pageSize, load],
  );

  return useMemo(
    () => ({
      suppliers,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      setSearch,
      setStatusFilter,
      setPage,
      setPageSize: changePageSize,
      refresh,
      addSupplier,
      editSupplier,
      removeSupplier,
    }),
    [
      suppliers,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      setSearch,
      setStatusFilter,
      refresh,
      addSupplier,
      editSupplier,
      removeSupplier,
      changePageSize,
    ],
  );
}
