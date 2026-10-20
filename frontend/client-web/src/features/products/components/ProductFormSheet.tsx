import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProductForm } from "./ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { ApiError } from "@/lib/api-client";
import type { Product, ProductFormValues } from "@/types/product";

interface ProductFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSaved?: (product: Product) => void;
}

export function ProductFormSheet({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormSheetProps) {
  const { addProduct, updateProduct } = useProductsStore();
  const { options, optionsLoading } = useCategoriesStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!product;

  const handleSubmit = async (data: ProductFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const saved = product
        ? await updateProduct(product.id, data)
        : await addProduct(data);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the product.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!saving) {
          setError(null);
          onOpenChange(next);
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="space-y-1 border-b px-6 py-4 pr-12">
          <SheetTitle>{isEdit ? "Edit product" : "Add product"}</SheetTitle>
          <SheetDescription className="text-xs">
            {isEdit
              ? `Update ${product.name}. Changes apply immediately.`
              : "Create a new product in the catalog."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {optionsLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading categories…
            </p>
          ) : options.length === 0 ? (
            <div className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              No categories exist yet. Create a category before adding a
              product.
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
              <ProductForm
                formId="product-form"
                hideFooter
                dense
                initial={product}
                categories={options}
                onSubmit={handleSubmit}
              />
            </>
          )}
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-form"
            className="min-w-[140px]"
            disabled={saving || optionsLoading || options.length === 0}
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
