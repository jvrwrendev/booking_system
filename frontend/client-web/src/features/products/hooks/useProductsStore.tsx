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

import { mockProducts } from "@/data/mock-products";
import {
  resolveStockMovements,
  validateStockLines,
  validateStockRelease,
} from "@/lib/stock";
import type { Product, ProductFormValues, ProductStatus } from "@/types/product";
import { validateProductForm, type ProductFormErrors } from "../lib/validation";

/**
 * Bumped to v2 when the catalog was replaced. Every product id was reused for a
 * different item, so a payload saved under v1 would resolve a booking's
 * productId to the wrong product and move its stock. Pairs with the categories
 * key and the v4 bookings key, which were bumped for the same reason.
 */
const STORAGE_KEY = "agrivet-products-v2";

export interface StockLine {
  productId: string;
  quantity: number;
}

export interface ProductStore {
  products: Product[];
  getProduct: (id: string) => Product | undefined;
  addProduct: (data: ProductFormValues) => { ok: boolean; errors?: ProductFormErrors };
  /**
   * `baselineStockQuantity` is required: it is the stock count the form was
   * opened with, and the only value that makes an edit's stock field a delta
   * rather than an absolute overwrite. Making it mandatory means a future caller
   * cannot silently opt into clobbering live stock.
   */
  updateProduct: (
    id: string,
    data: ProductFormValues,
    baselineStockQuantity: number
  ) => { ok: boolean; errors?: ProductFormErrors };
  /**
   * Refuses while open bookings still reference the product. `openRefCount` is
   * required so that omitting the check is a compile error, not a silent
   * deletion of a product a live booking depends on.
   */
  deleteProduct: (
    id: string,
    openRefCount: number
  ) => { ok: true } | { ok: false; error: string };
  setProductStatus: (id: string, status: ProductStatus) => void;
  /** Deducts stock for order lines, refusing the whole batch if any line is short. */
  deductStock: (lines: StockLine[]) => { ok: boolean; error?: string };
  restoreStock: (
    lines: StockLine[]
  ) => { ok: boolean; error?: string; warning?: string };
  getAvailableStock: (id: string) => number;
}

const ProductsContext = createContext<ProductStore | null>(null);

function loadProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Product[];
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return mockProducts;
}

function existingMaxId(existing: Product[]): number {
  return existing
    .map((p) => Number(p.id.replace("PRD-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
}
const trimmed = (value: string) => value.trim();
const optionalNumber = (value: number) =>
  Number.isFinite(value) ? value : undefined;

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(loadProducts);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      // Ignore quota/availability errors; state remains in-memory.
    }
  }, [products]);

  // Lets the handlers validate against the freshest list without being
  // re-created (and without re-rendering every consumer) on each change.
  const productsRef = useRef(products);
  productsRef.current = products;

  // Monotonic id counter. Re-deriving the next id from the list would hand out
  // the same id twice when two adds are dispatched in the same batch, because
  // both would read the same pre-update snapshot.
  const nextIdRef = useRef<number | null>(null);
  const allocateId = useCallback(() => {
    if (nextIdRef.current === null) {
      nextIdRef.current = existingMaxId(productsRef.current);
    }
    nextIdRef.current += 1;
    return `PRD-${String(nextIdRef.current).padStart(3, "0")}`;
  }, []);

  const addProduct = useCallback((data: ProductFormValues) => {
    const errors = validateProductForm(data, productsRef.current);
    if (Object.keys(errors).length > 0) return { ok: false, errors };

    const now = new Date().toISOString();
    const product: Product = {
      ...data,
      id: allocateId(),
      name: trimmed(data.name),
      sku: trimmed(data.sku).toUpperCase(),
      description: trimmed(data.description),
      unit: trimmed(data.unit),
      brand: trimmed(data.brand) || undefined,
      supplier: trimmed(data.supplier) || undefined,
      costPrice: optionalNumber(data.costPrice),
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [product, ...prev]);
    toast.success("Product added", {
      description: `${product.name} is now in the catalog.`,
    });
    return { ok: true };
  }, [allocateId]);

  /**
   * Applies the stock field as the difference the admin actually typed, measured
   * from the count the form was opened with. Without this, saving an unrelated
   * field would erase a deduction made by a booking accepted while the form was
   * open, and a later cancellation would return units that were never taken.
   */
  const updateProduct = useCallback(
    (
      id: string,
      data: ProductFormValues,
      baselineStockQuantity: number
    ) => {
      const errors = validateProductForm(data, productsRef.current, id);
      if (Object.keys(errors).length > 0) return { ok: false, errors };

      const { stockQuantity: formStock, ...editable } = data;

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            ...editable,
            name: trimmed(data.name),
            sku: trimmed(data.sku).toUpperCase(),
            description: trimmed(data.description),
            unit: trimmed(data.unit),
            brand: trimmed(data.brand) || undefined,
            supplier: trimmed(data.supplier) || undefined,
            costPrice: optionalNumber(data.costPrice),
            stockQuantity: Math.max(
              0,
              p.stockQuantity + (formStock - baselineStockQuantity)
            ),
            updatedAt: new Date().toISOString(),
          };
        })
      );
      toast.success("Product updated", {
        description: `${trimmed(data.name)} has been saved.`,
      });
      return { ok: true };
    },
    []
  );

  /**
   * Refuses to delete a product that open bookings still depend on.
   * `openRefCount` is supplied by the caller so this store stays independent of
   * the bookings store; a real API would enforce the same rule with a 409.
   */
  const deleteProduct = useCallback((id: string, openRefCount: number) => {
    if (openRefCount > 0) {
      const plural = openRefCount === 1 ? "booking" : "bookings";
      return {
        ok: false as const,
        error: `${openRefCount} open ${plural} still reference this product. Cancel or complete ${openRefCount === 1 ? "it" : "them"} first, or deactivate the product instead.`,
      };
    }
    const product = productsRef.current.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Product deleted", {
      description: product
        ? `${product.name} was removed from the catalog.`
        : undefined,
    });
    return { ok: true as const };
  }, []);

  const setProductStatus = useCallback((id: string, status: ProductStatus) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    const product = productsRef.current.find((p) => p.id === id);
    toast.success(status === "active" ? "Product activated" : "Product deactivated", {
      description: product
        ? status === "active"
          ? `${product.name} can be selected in new orders again.`
          : `${product.name} is hidden from new orders. Existing orders are unchanged.`
        : undefined,
    });
  }, []);

  const getAvailableStock = useCallback(
    (id: string) => productsRef.current.find((p) => p.id === id)?.stockQuantity ?? 0,
    []
  );

  /** Shared by deduct/restore: applies a signed multiplier to each line. */
  const adjustStockLines = useCallback((lines: StockLine[], sign: -1 | 1) => {
    const now = new Date().toISOString();
    const deltas = new Map<string, number>();
    for (const line of lines) {
      deltas.set(
        line.productId,
        (deltas.get(line.productId) ?? 0) + line.quantity * sign
      );
    }
    setProducts((prev) =>
      prev.map((p) => {
        const delta = deltas.get(p.id);
        if (!delta) return p;
        return {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity + delta),
          updatedAt: now,
        };
      })
    );
  }, []);

  const deductStock = useCallback(
    (lines: StockLine[]) => {
      const invalid = validateStockLines(lines);
      if (!invalid.ok) return invalid;

      const { rejected } = resolveStockMovements(
        productsRef.current,
        lines.map((l) => ({ productId: l.productId, quantity: -l.quantity }))
      );

      if (rejected.length > 0) {
        const detail = rejected
          .map((r) => {
            const name =
              productsRef.current.find((p) => p.id === r.productId)?.name ??
              r.productId;
            return `${name} (needs ${r.requested * -1}, ${r.available} available)`;
          })
          .join(", ");
        return {
          ok: false,
          error: `Not enough stock to complete this order: ${detail}.`,
        };
      }

      adjustStockLines(lines, -1);
      return { ok: true };
    },
    [adjustStockLines]
  );

  /**
   * Mirrors `deductStock`: the same line guard, then a check for products the
   * catalog no longer tracks. A missing product is reported as a warning rather
   * than refused, so a booking can still be closed out.
   */
  const restoreStock = useCallback(
    (lines: StockLine[]) => {
      const validLines = validateStockLines(lines);
      if (!validLines.ok) return validLines;

      const released = validateStockRelease(productsRef.current, lines);
      if (!released.ok) return released;

      adjustStockLines(lines, 1);
      return { ok: true, warning: released.warning };
    },
    [adjustStockLines]
  );

  const value = useMemo<ProductStore>(
    () => ({
      products,
      getProduct: (id) => products.find((p) => p.id === id),
      addProduct,
      updateProduct,
      deleteProduct,
      setProductStatus,
      deductStock,
      restoreStock,
      getAvailableStock,
    }),
    [
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      setProductStatus,
      deductStock,
      restoreStock,
      getAvailableStock,
    ]
  );

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  );
}

export function useProductsStore() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProductsStore must be used within ProductsProvider");
  return ctx;
}
