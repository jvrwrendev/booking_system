import { useNavigate, useParams } from "react-router-dom";

import { ProductForm } from "../components/ProductForm";
import { useProductsStore } from "../hooks/useProductsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { formatCurrency } from "@/lib/utils";
import { mockCategories } from "@/data/mock-categories";

export function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProduct, updateProduct } = useProductsStore();
  const { can } = usePermissions();

  const product = id ? getProduct(id) : undefined;

  if (!can("products.update")) {
    return <NotFound permission title="Permission denied" />;
  }
  if (!product) {
    return <NotFound title="Product not found" backHref="/products" />;
  }

  const category = mockCategories.find((c) => c.id === product.categoryId);

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
        onSubmit={(data) => {
          updateProduct(product.id, data);
          navigate(`/products/${product.id}`);
        }}
        onCancel={() => navigate(`/products/${product.id}`)}
      />
    </FormPageLayout>
  );
}
