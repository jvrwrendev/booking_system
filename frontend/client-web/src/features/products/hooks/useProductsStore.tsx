import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { mockProducts } from "@/data/mock-products";
import type { Product, ProductFormValues } from "@/types/product";

interface ProductsContextValue {
  products: Product[];
  addProduct: (data: ProductFormValues) => Product;
  updateProduct: (id: string, data: ProductFormValues) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

function nextId(existing: Product[]): string {
  const max = existing
    .map((p) => Number(p.id.replace("PRD-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `PRD-${String(max + 1).padStart(3, "0")}`;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const value = useMemo<ProductsContextValue>(
    () => ({
      products,
      addProduct: (data) => {
        const now = new Date().toISOString();
        const product: Product = {
          id: nextId(products),
          ...data,
          createdAt: now,
          updatedAt: now,
        };
        setProducts((prev) => [product, ...prev]);
        toast.success("Product added", {
          description: `${product.name} has been added to the catalog.`,
        });
        return product;
      },
      updateProduct: (id, data) => {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, ...data, updatedAt: new Date().toISOString() }
              : p
          )
        );
        toast.success("Product updated");
      },
      deleteProduct: (id) => {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success("Product deleted");
      },
      getProduct: (id) => products.find((p) => p.id === id),
    }),
    [products]
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