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
import type { Product, ProductFormValues } from "@/types/product";
import {
  bulkDeleteProducts as bulkDeleteProductsRequest,
  createProduct as createProductRequest,
  deleteProduct as deleteProductRequest,
  listProducts,
  toProduct,
  updateProduct as updateProductRequest,
} from "../services/products.service";
import type { BulkDeleteProductsParams } from "../services/products.service";

export interface ProductFilters {
  search: string;
  categoryId: string;
  status: string;
  stockStatus: string;
}

interface ProductsContextValue {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  setSearch: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setStockStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  refresh: () => Promise<void>;
  addProduct: (values: ProductFormValues) => Promise<Product>;
  updateProduct: (id: string, values: ProductFormValues) => Promise<Product>;
  removeProduct: (id: string, name: string) => Promise<void>;
  removeProducts: (input: BulkDeleteProductsParams) => Promise<number>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

const INITIAL_FILTERS: ProductFilters = {
  search: "",
  categoryId: "all",
  status: "all",
  stockStatus: "all",
};

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>(INITIAL_FILTERS);

  const debouncedSearch = useDebounce(filters.search, 300);

  const load = useCallback(
    async (nextPage: number, overridePageSize?: number) => {
      const size = overridePageSize ?? pageSize;
      setLoading(true);
      setError(null);
      try {
        const result = await listProducts({
          page: nextPage,
          pageSize: size,
          search: debouncedSearch || undefined,
          categoryId: filters.categoryId,
          status: filters.status,
          stockStatus: filters.stockStatus,
          sortBy: "updatedAt",
          sortOrder: "desc",
        });
        setProducts(result.products.map(toProduct));
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(messageFor(err, "Could not load products."));
        setProducts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [
      pageSize,
      debouncedSearch,
      filters.categoryId,
      filters.status,
      filters.stockStatus,
    ],
  );

  useEffect(() => {
    void load(page, pageSize);
  }, [
    debouncedSearch,
    filters.categoryId,
    filters.status,
    filters.stockStatus,
    page,
    pageSize,
    load,
  ]);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  const setCategoryFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, categoryId: value }));
    setPage(1);
  }, []);

  const setStatusFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPage(1);
  }, []);

  const setStockStatusFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, stockStatus: value }));
    setPage(1);
  }, []);

  const changePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(1);
  }, []);

  const refresh = useCallback(() => load(page, pageSize), [load, page, pageSize]);

  const addProduct = useCallback(
    async (values: ProductFormValues) => {
      try {
        const created = await createProductRequest(values);
        toast.success("Product added", {
          description: `${created.name} has been added to the catalog.`,
        });
        if (page !== 1) setPage(1);
        else await load(1, pageSize);
        return created;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          messageFor(err, "Could not create the product."),
        );
      }
    },
    [page, pageSize, load],
  );

  const updateProduct = useCallback(
    async (id: string, values: ProductFormValues) => {
      try {
        const updated = await updateProductRequest(id, values);
        toast.success("Product updated", {
          description: `${updated.name} was saved.`,
        });
        await load(page, pageSize);
        return updated;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          messageFor(err, "Could not save the product."),
        );
      }
    },
    [page, pageSize, load],
  );

  const removeProduct = useCallback(
    async (id: string, name: string) => {
      try {
        await deleteProductRequest(id);
        toast.success("Product deleted", {
          description: `${name} was removed from the catalog.`,
        });
        const remaining = products.length - 1;
        const nextPage = remaining === 0 && page > 1 ? page - 1 : page;
        await load(nextPage, pageSize);
      } catch (err) {
        toast.error("Could not delete product", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [products.length, page, pageSize, load],
  );

  const removeProducts = useCallback(
    async (input: BulkDeleteProductsParams) => {
      try {
        const { deleted } = await bulkDeleteProductsRequest(input);
        if (deleted === 0) {
          toast.success("No products deleted", {
            description: "Nothing matched the selected products.",
          });
        } else {
          toast.success(
            deleted === 1 ? "Product deleted" : `${deleted} products deleted`,
            {
              description: `${deleted} product${
                deleted === 1 ? " was" : "s were"
              } removed from the catalog.`,
            },
          );
        }

        const remaining = Math.max(0, total - deleted);
        const lastPage = Math.max(1, Math.ceil(remaining / pageSize));
        await load(Math.min(page, lastPage), pageSize);
        return deleted;
      } catch (err) {
        toast.error("Could not delete products", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [total, page, pageSize, load],
  );

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      setSearch,
      setCategoryFilter,
      setStatusFilter,
      setStockStatusFilter,
      setPage,
      setPageSize: changePageSize,
      refresh,
      addProduct,
      updateProduct,
      removeProduct,
      removeProducts,
    }),
    [
      products,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      setSearch,
      setCategoryFilter,
      setStatusFilter,
      setStockStatusFilter,
      refresh,
      addProduct,
      updateProduct,
      removeProduct,
      removeProducts,
      changePageSize,
    ],
  );

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProductsStore() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProductsStore must be used within ProductsProvider");
  }
  return context;
}
