import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, PackagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { DetailsPanel } from "@/components/common/DetailsPanel";
import { NotFound } from "@/components/common/NotFound";
import { ProductForm } from "../components/ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api-client";
import type { ProductFormValues } from "@/types/product";

export function ProductAddPage() {
  const navigate = useNavigate();
  const { addProduct } = useProductsStore();
  const { options: categories, optionsLoading } = useCategoriesStore();
  const { can } = usePermissions();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!can("products.create")) {
    return <NotFound permission title="Permission denied" />;
  }

  const handleSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const product = await addProduct(values);
      navigate(`/products/${product.id}`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not create the product.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPageLayout
      fullscreen
      title="Add product"
      description="Create a new product in the catalog, set pricing and opening stock, and optionally link it to a supplier."
      backHref="/products"
      backLabel="Back to products"
      breadcrumbs={[
        { label: "Operations" },
        { label: "Products", href: "/products" },
        { label: "Add" },
      ]}
      topActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/products")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-add-form"
            className="min-w-[150px]"
            disabled={saving || optionsLoading || categories.length === 0}
          >
            <PackagePlus className="h-4 w-4" />
            {saving ? "Creating…" : "Create product"}
          </Button>
        </>
      }
      sidebar={
        <DetailsPanel
          title="Product setup"
          description="A few things to keep in mind before saving."
          items={[
            {
              label: "Categories",
              value: `${categories.length} available`,
              hint: "Products must be assigned to an existing category.",
            },
            {
              label: "Supplier",
              value: "Optional",
              hint: "Select a supplier from Supplier Management or leave it blank.",
            },
            {
              label: "Opening stock",
              value: "Creates an inventory transaction",
              hint: "Opening stock is recorded against the primary branch.",
            },
          ]}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                SKUs are uppercased automatically and must be unique across the
                catalog.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                A product without a supplier can still be booked, sold, and
                stocked. You can add a supplier later by editing the product.
              </p>
            </div>
          </div>
        </DetailsPanel>
      }
    >
      {optionsLoading ? (
        <p className="text-sm text-muted-foreground">Loading categories…</p>
      ) : categories.length === 0 ? (
        <div className="rounded-md border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No categories exist yet. Create a category before adding a product.
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <ProductForm
            formId="product-add-form"
            hideFooter
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/products")}
          />
        </>
      )}
    </FormPageLayout>
  );
}
