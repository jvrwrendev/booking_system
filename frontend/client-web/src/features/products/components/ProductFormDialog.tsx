import { useState } from "react";
import { PackagePlus } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "./ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { ApiError } from "@/lib/api-client";
import type { Product, ProductFormValues } from "@/types/product";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new product. */
  product?: Product;
  onSaved?: (product: Product) => void;
}

/**
 * Create or edit a product in a centred modal.
 *
 * Replaces both the standalone `/products/add` page and the old right-side
 * sheet, so the catalog has one editing surface.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
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
        err instanceof ApiError ? err.message : "Could not save the product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (saving) return;
    if (!next) setError(null);
    onOpenChange(next);
  };

  const noCategories = !optionsLoading && options.length === 0;

  return (
    <FormDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={isEdit ? "Edit product" : "Add product"}
      description={
        isEdit
          ? `Update ${product.name}. Changes apply immediately.`
          : "Create a product in the catalog, set pricing and opening stock, and optionally link a supplier."
      }
      icon={<PackagePlus className="h-4 w-4" aria-hidden />}
      formId="product-form"
      submitLabel={isEdit ? "Save changes" : "Create product"}
      submitting={saving}
      submitDisabled={optionsLoading || noCategories}
      className="sm:max-w-3xl"
    >
      {optionsLoading ? (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : noCategories ? (
        <Alert variant="warning">
          <AlertDescription>
            No categories exist yet. Create a category before adding a product.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ProductForm
            formId="product-form"
            hideFooter
            dense
            initial={product}
            categories={options}
            onSubmit={handleSubmit}
          />
        </div>
      )}
    </FormDialog>
  );
}
