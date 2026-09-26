import { useMemo, useState } from "react";
import { AlertTriangle, Minus, Package, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, getStockStatusVariant, humanize } from "@/components/common/StatusBadge";

import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { useSellableProducts } from "@/features/products/hooks/useSellableProducts";
import { getStockStatus } from "@/lib/stock";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";

interface BookingProductPickerProps {
  /** Quantities already on the draft, used to show remaining stock. */
  quantityByProduct: Map<string, number>;
  onAdd: (product: Product, quantity: number) => void;
}

export function BookingProductPicker({
  quantityByProduct,
  onAdd,
}: BookingProductPickerProps) {
  const products = useSellableProducts();
  const { categories } = useCategoriesStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pending, setPending] = useState<Record<string, number>>({});

  const categoryName = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => byId.get(id) ?? "Uncategorized";
  }, [categories]);

  const categoryOptions = useMemo(
    () => categories.filter((c) => c.status === "active"),
    [categories]
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter)
        return false;
      if (!term) return true;
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        (p.brand ?? "").toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryFilter]);

  const availableFor = (product: Product) =>
    product.stockQuantity - (quantityByProduct.get(product.id) ?? 0);

  const setPendingQuantity = (productId: string, quantity: number) => {
    setPending((prev) => ({ ...prev, [productId]: quantity }));
  };

  const submit = (product: Product) => {
    const quantity = pending[product.id] ?? 1;
    onAdd(product, quantity);
    setPending((prev) => ({ ...prev, [product.id]: 1 }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU, or brand..."
            className="h-9 pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-9 w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="max-h-[340px] overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No active products match your search.
            </p>
          ) : (
            <ul className="divide-y">
              {results.map((product) => {
                const remaining = availableFor(product);
                const soldOut = remaining <= 0;
                const stock = getStockStatus(
                  product.stockQuantity,
                  product.minimumStockLevel
                );
                const selected = quantityByProduct.get(product.id) ?? 0;
                return (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Package className="h-4 w-4" />
                    </div>

                    <div className="min-w-[160px] flex-1">
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-mono">{product.sku}</span> ·{" "}
                        {categoryName(product.categoryId)} · {product.unit}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selected > 0 && `${selected} on order · `}
                        {remaining} available
                      </p>
                    </div>

                    <div className="w-[104px]">
                      {product.stockQuantity <= 0 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Out of stock
                        </Badge>
                      ) : (
                        <StatusBadge
                          label={humanize(stock)}
                          variant={getStockStatusVariant(stock)}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={soldOut}
                        onClick={() =>
                          setPendingQuantity(
                            product.id,
                            Math.max(1, (pending[product.id] ?? 1) - 1)
                          )
                        }
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={Math.max(1, remaining)}
                        value={pending[product.id] ?? 1}
                        onChange={(e) =>
                          setPendingQuantity(
                            product.id,
                            Math.max(
                              1,
                              Math.min(
                                Number(e.target.value) || 1,
                                Math.max(1, remaining)
                              )
                            )
                          )
                        }
                        disabled={soldOut}
                        className="h-8 w-14 text-center"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        disabled={soldOut}
                        onClick={() =>
                          setPendingQuantity(
                            product.id,
                            Math.min(
                              (pending[product.id] ?? 1) + 1,
                              Math.max(1, remaining)
                            )
                          )
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      className="h-8"
                      disabled={soldOut}
                      onClick={() => submit(product)}
                    >
                      Add
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Stock is deducted when an admin accepts the booking, not when it is
        created. A pending booking does not reserve units.
      </p>
    </div>
  );
}
