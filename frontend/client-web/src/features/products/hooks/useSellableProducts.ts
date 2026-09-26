import { useMemo } from "react";

import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import type { Product } from "@/types/product";
import { useProductsStore } from "./useProductsStore";

/**
 * Products that may be added to a new booking.
 *
 * A product is sellable only when the product itself is active *and* the
 * category it belongs to is active. Deactivating a category therefore hides its
 * products from new orders without touching the products themselves, which is
 * why this cannot be a simple field on the product.
 */
export function useSellableProducts(): Product[] {
  const { products } = useProductsStore();
  const { categories } = useCategoriesStore();

  return useMemo(() => {
    const activeCategoryIds = new Set(
      categories.filter((c) => c.status === "active").map((c) => c.id)
    );
    return products.filter(
      (p) => p.status === "active" && activeCategoryIds.has(p.categoryId)
    );
  }, [products, categories]);
}
