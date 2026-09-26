import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductForm } from "../components/ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { DetailsPanel } from "@/components/common/DetailsPanel";
import type { ProductFormErrors } from "../lib/validation";

export function ProductAddPage() {
  const navigate = useNavigate();
  const { addProduct, products } = useProductsStore();
  const { categories } = useCategoriesStore();
  const { can } = usePermissions();
  const [errors, setErrors] = useState<ProductFormErrors>({});

  if (!can("products.create")) {
    return <NotFound permission title="Permission denied" />;
  }

  const activeProducts = products.filter((p) => p.status === "active").length;
  const activeCategories = categories.filter(
    (c) => c.status === "active"
  ).length;

  return (
    <FormPageLayout
      fullscreen
      title="Add product"
      description="Create a new product to add to the catalog. Fill in the required fields and set pricing."
      backHref="/products"
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
          >
            Cancel
          </Button>
          <Button type="submit" form="product-add-form" className="min-w-[140px]">
            <Package className="h-4 w-4" />
            Create product
          </Button>
        </>
      }
      sidebar={
        <DetailsPanel
          title="Product details"
          description="Helpful context before you save a new product."
          items={[
            {
              label: "Visibility",
              value: "Catalog listing",
              hint: "Products start as active and appear in the catalog immediately.",
            },
            {
              label: "Categories",
              value: `${activeCategories} active`,
              hint: "Pick the most specific category for better filtering.",
            },
            {
              label: "Current catalog",
              value: `${activeProducts} active`,
              hint: "Inactive or out-of-stock products stay hidden until restored.",
            },
          ]}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Use a unique SKU for each product. This code is used across
                inventory, sales reports, and barcode scans.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                The margin field updates automatically once you enter both the
                cost and selling price.
              </p>
            </div>
          </div>
        </DetailsPanel>
      }
    >
      <ProductForm
        formId="product-add-form"
        hideFooter
        errors={errors}
        onSubmit={(data) => {
          const result = addProduct(data);
          if (!result.ok) {
            setErrors(result.errors ?? {});
            return;
          }
          setErrors({});
          navigate("/products");
        }}
        onCancel={() => navigate("/products")}
      />
    </FormPageLayout>
  );
}
