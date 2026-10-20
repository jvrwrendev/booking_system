import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, MoreHorizontal, Package, Plus, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { ProductFormSheet } from "../components/ProductFormSheet";
import {
  StatusBadge,
  getStatusVariantFromGeneric,
  getStockStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import type { Product } from "@/types/product";
import { getProductStockStatus } from "@/types/product";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function ProductsListPage() {
  const {
    products,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setSearch,
    setCategoryFilter,
    setStatusFilter,
    setStockStatusFilter,
    setPage,
    setPageSize,
    refresh,
    removeProduct,
  } = useProductsStore();
  const { options: categories } = useCategoriesStore();
  const { can } = usePermissions();
  const [searchParams] = useSearchParams();

  const [deleting, setDeleting] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  // Categories and suppliers link here with ?category=<id> / ?search=<term>.
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && category !== filters.categoryId) {
      setCategoryFilter(category);
    }
    const search = searchParams.get("search");
    if (search !== null && search !== filters.search) {
      setSearch(search);
    }
    // Only react to the URL parameter, not to every filter change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const columns: DataTableColumn<Product>[] = [
    {
      id: "name",
      header: "Product",
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-primary/10">
            {p.image ? (
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <Package className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              to={`/products/${p.id}`}
              className="block truncate text-sm font-medium hover:text-primary"
            >
              {p.name}
            </Link>
            <div className="truncate text-xs text-muted-foreground">
              {p.brand || "No brand"} · {p.unit}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name",
    },
    {
      id: "sku",
      header: "SKU",
      cell: (p) => <span className="font-mono text-xs">{p.sku}</span>,
      sortable: true,
      sortKey: "sku",
      className: "hidden md:table-cell",
    },
    {
      id: "category",
      header: "Category",
      cell: (p) => (
        <span className="text-sm">{p.categoryName ?? "Uncategorized"}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "price",
      header: "Price",
      cell: (p) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(p.sellingPrice)}</div>
          <div className="text-[11px] text-muted-foreground">
            Cost {formatCurrency(p.costPrice)}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "sellingPrice",
    },
    {
      id: "stock",
      header: "Stock",
      cell: (p) => (
        <div className="text-sm">
          <div className="font-medium">{p.stockQuantity}</div>
          <div className="text-[11px] text-muted-foreground">
            Min {p.minimumStockLevel}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "stockQuantity",
    },
    {
      id: "status",
      header: "Status",
      cell: (p) => {
        const stock = p.stockStatus ?? getProductStockStatus(p);
        return (
          <div className="flex flex-col items-start gap-1">
            <StatusBadge
              label={humanize(p.status)}
              variant={getStatusVariantFromGeneric(p.status)}
            />
            <StatusBadge
              label={humanize(stock)}
              variant={getStockStatusVariant(stock)}
            />
          </div>
        );
      },
    },
    {
      id: "updated",
      header: "Updated",
      cell: (p) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(p.updatedAt)}
        </span>
      ),
      sortable: true,
      sortKey: "updatedAt",
      className: "hidden lg:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/products/${p.id}`}>
                <Eye className="h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            {can("products.update") && (
              <DropdownMenuItem onSelect={() => setEditing(p)}>
                <Pencil className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {can("products.delete") && (
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setDeleting(p)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your agrivet product catalog and pricing."
        breadcrumbs={[{ label: "Operations" }, { label: "Products" }]}
        actions={
          can("products.create") && (
            <Button asChild>
              <Link to="/products/add">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          )
        }
      />

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            Retry
          </Button>
        </div>
      )}

      <DataTable<Product>
        data={products}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search products by name, SKU, or brand..."
        rowKey={(p) => p.id}
        serverMode={{
          search: filters.search,
          onSearchChange: setSearch,
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        emptyState={
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium">
              {filters.search ||
              filters.categoryId !== "all" ||
              filters.status !== "all" ||
              filters.stockStatus !== "all"
                ? "No products match your filters"
                : "No products yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filters.search ||
              filters.categoryId !== "all" ||
              filters.status !== "all" ||
              filters.stockStatus !== "all"
                ? "Try a different search term or clear the filters."
                : "Add the first product to build your catalog."}
            </p>
          </div>
        }
        toolbar={
          <>
            <Select
              value={filters.categoryId}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.stockStatus}
              onValueChange={setStockStatusFilter}
            >
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Stock level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <ProductFormSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        product={editing ?? undefined}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete product"
        description="This action cannot be undone. The product will be permanently removed from the catalog and its stock history."
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const target = deleting;
          setDeleting(null);
          await removeProduct(target.id, target.name).catch(() => {});
        }}
      />
    </div>
  );
}
