import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, MoreHorizontal, Package, Plus, Trash2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
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
import { Checkbox } from "@/components/ui/checkbox";

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
    removeProducts,
  } = useProductsStore();
  const { options: categories } = useCategoriesStore();
  const { can } = usePermissions();
  const [searchParams] = useSearchParams();

  const [deleting, setDeleting] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Selection either holds explicit ids or "all products matching the current
  // filters" with the rows the user unchecked tracked as exclusions.
  const [selectionMode, setSelectionMode] = useState<"explicit" | "all">(
    "explicit",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [excludedIds, setExcludedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const canDelete = can("products.delete");

  // A different search or filter produces a different match set, so a stale
  // selection would no longer mean what the user picked.
  useEffect(() => {
    setSelectionMode("explicit");
    setSelectedIds(new Set());
    setExcludedIds(new Set());
  }, [
    filters.search,
    filters.categoryId,
    filters.status,
    filters.stockStatus,
  ]);

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

  const hasFilters =
    !!filters.search ||
    filters.categoryId !== "all" ||
    filters.status !== "all" ||
    filters.stockStatus !== "all";

  const selectedCount =
    selectionMode === "all"
      ? Math.max(0, total - excludedIds.size)
      : selectedIds.size;

  const isRowSelected = (id: string) =>
    selectionMode === "all" ? !excludedIds.has(id) : selectedIds.has(id);

  const toggleRow = (id: string, checked: boolean) => {
    if (selectionMode === "all") {
      setExcludedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(new Set());
    setExcludedIds(new Set());
    setSelectionMode(checked ? "all" : "explicit");
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;
    setBulkDeleteOpen(false);
    try {
      await removeProducts(
        selectionMode === "all"
          ? {
              selectAll: true,
              filters: {
                search: filters.search,
                categoryId: filters.categoryId,
                status: filters.status,
                stockStatus: filters.stockStatus,
              },
              excludeIds: [...excludedIds],
            }
          : { ids: [...selectedIds] },
      );
      setSelectionMode("explicit");
      setSelectedIds(new Set());
      setExcludedIds(new Set());
    } catch {
      // The store already surfaced the error; keep the selection for a retry.
    }
  };

  const selectionColumn: DataTableColumn<Product> = {
    id: "select",
    className: "w-10",
    header: (
      <Checkbox
        checked={
          selectionMode === "all" && excludedIds.size === 0
            ? true
            : selectedCount > 0
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => toggleSelectAll(value === true)}
        aria-label="Select all products matching the current filters"
      />
    ),
    cell: (p) => (
      <Checkbox
        checked={isRowSelected(p.id)}
        onCheckedChange={(value) => toggleRow(p.id, value === true)}
        aria-label={`Select ${p.name}`}
        onClick={(event) => event.stopPropagation()}
      />
    ),
  };

  const columns: DataTableColumn<Product>[] = [
    ...(canDelete ? [selectionColumn] : []),
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
                <Package className="h-4 w-4" aria-hidden />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <Link
              to={`/products/${p.id}`}
              className="block truncate text-sm font-medium text-foreground hover:text-primary"
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
          <div className="font-medium tabular-nums text-foreground">
            {formatCurrency(p.sellingPrice)}
          </div>
          <div className="text-xs text-muted-foreground">
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
          <div className="font-medium tabular-nums text-foreground">
            {p.stockQuantity}
          </div>
          <div className="text-xs text-muted-foreground">
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
              variant={getStatusVariant(p.status)}
            />
            <StatusBadge
              label={humanize(stock)}
              variant={getStatusVariant(stock)}
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
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={`Actions for ${p.name}`}
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/products/${p.id}`}>
                <Eye className="h-4 w-4" aria-hidden />
                View details
              </Link>
            </DropdownMenuItem>
            {can("products.update") && (
              <DropdownMenuItem onSelect={() => setEditing(p)}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </DropdownMenuItem>
            )}
            {can("products.delete") && (
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onSelect={() => setDeleting(p)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
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
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add Product
            </Button>
          )
        }
      />

      <DataTable<Product>
        data={products}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void refresh()}
        searchPlaceholder="Search products by name, SKU, or brand…"
        rowKey={(p) => p.id}
        globalActions={
          canDelete && selectedCount > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Delete selected ({selectedCount})
            </Button>
          ) : undefined
        }
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
          <EmptyState
            icon={<Package className="h-5 w-5" aria-hidden />}
            title={
              hasFilters ? "No products match your filters" : "No products yet"
            }
            description={
              hasFilters
                ? "Try a different search term or clear the filters."
                : "Add the first product to build your catalog."
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setStockStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : can("products.create") ? (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden />
                  Add Product
                </Button>
              ) : undefined
            }
          />
        }
        toolbar={
          <>
            <Select
              value={filters.categoryId}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger
                className="h-9 w-full sm:w-[160px]"
                aria-label="Filter by category"
              >
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
              <SelectTrigger
                className="h-9 w-full sm:w-[140px]"
                aria-label="Filter by status"
              >
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
              <SelectTrigger
                className="h-9 w-full sm:w-[150px]"
                aria-label="Filter by stock level"
              >
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

      <ProductFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
      />

      <ProductFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        product={editing ?? undefined}
      />

      <ConfirmDialog
        open={bulkDeleteOpen && selectedCount > 0}
        onOpenChange={setBulkDeleteOpen}
        title="Delete selected products"
        description={`This will permanently delete ${selectedCount} ${
          selectedCount === 1 ? "product" : "products"
        }${
          selectionMode === "all" ? " matching your current filters" : ""
        }. This action cannot be undone.`}
        confirmText={`Delete ${selectedCount}`}
        destructive
        onConfirm={() => void handleBulkDelete()}
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
