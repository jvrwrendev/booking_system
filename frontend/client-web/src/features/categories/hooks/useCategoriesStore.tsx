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

import { mockCategories } from "@/data/mock-categories";
import type { Category, CategoryFormValues, CategoryStatus } from "@/types/category";

/**
 * Bumped to v2 when the catalog was replaced. Category ids were reused for
 * different categories, so a v1 payload would leave products pointing at the
 * wrong category. Pairs with the products and bookings keys.
 */
const STORAGE_KEY = "agrivet-categories-v2";

export type DeleteCategoryResult =
  | { ok: true }
  | { ok: false; error: string };

export interface CategoryStore {
  categories: Category[];
  /** Categories a product can be assigned to and that orders can draw from. */
  activeCategories: Category[];
  getCategory: (id: string) => Category | undefined;
  addCategory: (data: CategoryFormValues) => Category;
  updateCategory: (id: string, data: CategoryFormValues) => void;
  /**
   * Refuses to delete a category that still has products assigned to it.
   * `productCount` is supplied by the caller so this store stays independent of
   * the product store; a real API would enforce the same rule with a 409.
   */
  deleteCategory: (id: string, productCount: number) => DeleteCategoryResult;
  setCategoryStatus: (id: string, status: CategoryStatus) => void;
}

const CategoryContext = createContext<CategoryStore | null>(null);

function loadCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Category[];
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return mockCategories;
}

function nextId(existing: Category[]): string {
  const max = existing
    .map((c) => Number(c.id.replace("CAT-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `CAT-${String(max + 1).padStart(3, "0")}`;
}

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(loadCategories);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // Ignore quota/availability errors; state remains in-memory.
    }
  }, [categories]);

  // Lets the add handler read the freshest list without re-creating itself.
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const addCategory = useCallback((data: CategoryFormValues) => {
    const category: Category = {
      id: nextId(categoriesRef.current),
      name: data.name.trim(),
      description: data.description.trim(),
      status: data.status,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, category]);
    toast.success("Category created", {
      description: `${category.name} is now available in the catalog.`,
    });
    return category;
  }, []);

  const updateCategory = useCallback((id: string, data: CategoryFormValues) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              name: data.name.trim(),
              description: data.description.trim(),
              status: data.status,
            }
          : c
      )
    );
    toast.success("Category updated", {
      description: `${data.name.trim()} has been saved.`,
    });
  }, []);

  const deleteCategory = useCallback(
    (id: string, productCount: number): DeleteCategoryResult => {
      if (productCount > 0) {
        const plural = productCount === 1 ? "product" : "products";
        return {
          ok: false,
          error: `This category still has ${productCount} ${plural} assigned. Move or delete ${productCount === 1 ? "it" : "them"} first.`,
        };
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
      return { ok: true };
    },
    []
  );

  const setCategoryStatus = useCallback(
    (id: string, status: CategoryStatus) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
      toast.success(
        status === "active" ? "Category activated" : "Category deactivated",
        {
          description:
            status === "active"
              ? "The category is selectable again."
              : "Products in this category are hidden from new orders.",
        }
      );
    },
    []
  );

  const value = useMemo<CategoryStore>(
    () => ({
      categories,
      activeCategories: categories.filter((c) => c.status === "active"),
      getCategory: (id) => categories.find((c) => c.id === id),
      addCategory,
      updateCategory,
      deleteCategory,
      setCategoryStatus,
    }),
    [categories, addCategory, updateCategory, deleteCategory, setCategoryStatus]
  );

  return (
    <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
  );
}

export function useCategoriesStore() {
  const ctx = useContext(CategoryContext);
  if (!ctx)
    throw new Error("useCategoriesStore must be used within CategoriesProvider");
  return ctx;
}

/** Counts the products assigned to a category. */
export function countProductsInCategory(
  products: { categoryId: string }[],
  categoryId: string
): number {
  return products.reduce(
    (count, p) => (p.categoryId === categoryId ? count + 1 : count),
    0
  );
}
