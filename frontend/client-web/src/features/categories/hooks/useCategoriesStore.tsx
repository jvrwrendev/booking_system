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
import type { Category, CategoryFormValues } from "@/types/category";
import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  listCategories,
  listCategoryOptions,
  toCategory,
  updateCategory as updateCategoryRequest,
} from "../services/categories.service";

export interface CategoryFilters {
  search: string;
  status: string;
}

interface CategoriesContextValue {
  categories: Category[];
  options: Category[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  optionsLoading: boolean;
  error: string | null;
  filters: CategoryFilters;
  setSearch: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  refresh: () => Promise<void>;
  refreshOptions: () => Promise<void>;
  addCategory: (values: CategoryFormValues) => Promise<Category>;
  editCategory: (id: string, values: CategoryFormValues) => Promise<Category>;
  removeCategory: (id: string) => Promise<void>;
}

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

const INITIAL_FILTERS: CategoryFilters = { search: "", status: "all" };

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [options, setOptions] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CategoryFilters>(INITIAL_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 300);

  const load = useCallback(
    async (nextPage: number, overridePageSize?: number) => {
      const size = overridePageSize ?? pageSize;
      setLoading(true);
      setError(null);
      try {
        const result = await listCategories({
          page: nextPage,
          pageSize: size,
          search: debouncedSearch || undefined,
          status: filters.status,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
        setCategories(result.categories.map(toCategory));
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(messageFor(err, "Could not load categories."));
        setCategories([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, debouncedSearch, filters.status],
  );

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    try {
      setOptions(await listCategoryOptions());
    } catch (err) {
      toast.error("Could not load categories", {
        description: messageFor(err, "Please try again."),
      });
    } finally {
      setOptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize);
  }, [debouncedSearch, filters.status, page, pageSize, load]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

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

  const refreshOptions = useCallback(async () => {
    await loadOptions();
  }, [loadOptions]);

  const addCategory = useCallback(
    async (values: CategoryFormValues) => {
      try {
        const created = await createCategoryRequest(values);
        toast.success("Category created", {
          description: `${created.name} is now available for products.`,
        });
        setOptions((prev) =>
          [...prev.filter((category) => category.id !== created.id), created].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        );
        if (page !== 1) setPage(1);
        else await load(1, pageSize);
        return created;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          messageFor(err, "Could not create the category."),
        );
      }
    },
    [page, pageSize, load],
  );

  const editCategory = useCallback(
    async (id: string, values: CategoryFormValues) => {
      try {
        const updated = await updateCategoryRequest(id, values);
        toast.success("Category updated", {
          description: `${updated.name} was saved.`,
        });
        setOptions((prev) =>
          prev
            .map((category) => (category.id === updated.id ? updated : category))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        await load(page, pageSize);
        return updated;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          messageFor(err, "Could not save the category."),
        );
      }
    },
    [page, pageSize, load],
  );

  const removeCategory = useCallback(
    async (id: string) => {
      try {
        await deleteCategoryRequest(id);
        toast.success("Category deleted");
        setOptions((prev) => prev.filter((category) => category.id !== id));
        const remaining = categories.length - 1;
        const nextPage = remaining === 0 && page > 1 ? page - 1 : page;
        await load(nextPage, pageSize);
      } catch (err) {
        toast.error("Could not delete category", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [categories.length, page, pageSize, load],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categories,
      options,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      optionsLoading,
      error,
      filters,
      setSearch,
      setStatusFilter,
      setPage,
      setPageSize: changePageSize,
      refresh,
      refreshOptions,
      addCategory,
      editCategory,
      removeCategory,
    }),
    [
      categories,
      options,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      optionsLoading,
      error,
      filters,
      setSearch,
      setStatusFilter,
      refresh,
      refreshOptions,
      addCategory,
      editCategory,
      removeCategory,
      changePageSize,
    ],
  );

  return (
    <CategoriesContext.Provider value={value}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategoriesStore() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error("useCategoriesStore must be used within CategoriesProvider");
  }
  return context;
}
