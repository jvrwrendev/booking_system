import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  StatusBadge,
  getStatusVariantFromGeneric,
  getStockStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { NotFound } from "@/components/common/NotFound";

import { useProductsStore } from "../hooks/useProductsStore";
import { mockCategories } from "@/data/mock-categories";
import { getProductStockStatus } from "@/types/product";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getProduct } = useProductsStore();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const product = id ? getProduct(id) : undefined;
  if (!product) {
    return <NotFound title="Product not found" backHref="/products" />;
  }

  const category = mockCategories.find((c) => c.id === product.categoryId);
  const stockStatus = getProductStockStatus(product);
  const margin = product.sellingPrice - product.costPrice;
  const marginPercent =
    product.costPrice > 0
      ? Math.round((margin / product.costPrice) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/products")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Button>

      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · ${category?.name ?? "Uncategorized"}`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Products", href: "/products" },
          { label: product.name },
        ]}
        actions={
          can("products.update") && (
            <Button asChild>
              <Link to={`/products/${product.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <div className="h-28 w-28 overflow-hidden rounded-lg border bg-muted/40 sm:w-32">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Package className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-muted-foreground">
                  {product.description || "No description provided."}
                </p>
                <p className="text-xs text-muted-foreground">
                  Category: {category?.name ?? "Uncategorized"}
                </p>
              </div>
            </div>
            <Separator />
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <InfoRow label="Brand" value={product.brand || "—"} />
              <InfoRow label="Unit" value={product.unit} />
              <InfoRow label="Supplier" value={product.supplier || "—"} />
              <InfoRow label="Cost Price" value={formatCurrency(product.costPrice)} />
              <InfoRow label="Selling Price" value={formatCurrency(product.sellingPrice)} />
              <InfoRow
                label="Margin"
                value={`${formatCurrency(margin)} (${marginPercent}%)`}
              />
              <InfoRow label="Created" value={formatDate(product.createdAt)} />
              <InfoRow label="Updated" value={formatDate(product.updatedAt)} />
            </dl>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Catalog Status</span>
                <StatusBadge
                  variant={getStatusVariantFromGeneric(product.status)}
                  label={humanize(product.status)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Stock Status</span>
                <StatusBadge
                  variant={getStockStatusVariant(stockStatus)}
                  label={humanize(stockStatus)}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Inventory Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">On hand</span>
                <span className="font-medium">{product.stockQuantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Minimum</span>
                <span className="font-medium">{product.minimumStockLevel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reorder Qty</span>
                <span className="font-medium">
                  {Math.max(0, product.minimumStockLevel * 2 - product.stockQuantity)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}