import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { ProductForm } from "../components/ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { formatCurrency } from "@/lib/utils";
import type { ProductFormErrors } from "../lib/validation";

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, updateProduct } = useProductsStore();
  const { categories } = useCategoriesStore();
  const { can } = usePermissions();
  const [errors, setErrors] = useState<ProductFormErrors>({});

  const product = id ? getProduct(id) : undefined;

  if (!can("products.update")) {
    return <NotFound permission title="Permission denied" />;
  }
  if (!product) {
    return <NotFound title="Product not found" backHref="/products" />;
  }

  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <FormPageLayout
      title={product.name}
      description={`SKU ${product.sku} · Update the details of this product.`}
      backHref={`/products/${product.id}`}
      breadcrumbs={[
        { label: "Operations" },
        { label: "Products", href: "/products" },
        { label: product.name, href: `/products/${product.id}` },
        { label: "Edit" },
      ]}
      meta={[
        { label: "SKU", value: product.sku },
        { label: "Category", value: category?.name ?? "Uncategorized" },
        { label: "Price", value: formatCurrency(product.sellingPrice) },
        { label: "Status", value: product.status },
      ]}
    >
      <ProductForm
        initial={product}
        submitLabel="Save changes"
        errors={errors}
        onSubmit={(data, openedStock) => {
          if (openedStock === undefined) {
            toast.error("Could not save changes", {
              description:
                "This product has no recorded stock level. Reload the page and try again.",
            });
            return;
          }
          // `openedStock` is the count the form was opened with, so a booking
          // accepted while this page was open is not written over on save.
          const result = updateProduct(product.id, data, openedStock);
          if (!result.ok) {
            setErrors(result.errors ?? {});
            return;
          }
          setErrors({});
          navigate(`/products/${product.id}`);
        }}
        onCancel={() => navigate(`/products/${product.id}`)}
      />
    </FormPageLayout>
  );
}
