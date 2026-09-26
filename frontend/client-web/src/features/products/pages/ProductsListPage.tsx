import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  MoreHorizontal,
  Package,
  Plus,
  Power,
  PowerOff,
  Trash2,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
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
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { canAffectStock } from "@/types/booking";
import { getStockStatus, type StockStatus } from "@/lib/stock";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

const STOCK_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All stock levels" },
  { value: "out_of_stock", label: "Out of stock" },
  { value: "critical", label: "Critical" },
  { value: "low_stock", label: "Low stock" },
  { value: "in_stock", label: "In stock" },
];

export function ProductsListPage() {
  const { products, deleteProduct, setProductStatus } = useProductsStore();
  const { categories } = useCategoriesStore();
  const { bookings } = useBookingsStore();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryName = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c.name]));
    return (id: string) => byId.get(id) ?? "Uncategorized";
  }, [categories]);

  /**
   * Open bookings that can still deduct or return units of each product. The
   * products store cannot know this itself, so the list page counts it here and
   * passes it to the delete guard. Counting only committed bookings would let a
   * product be deleted while a pending booking still claims it.
   */
  const openRefCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const booking of bookings) {
      if (!canAffectStock(booking)) continue;
      for (const id of new Set(booking.items.map((i) => i.productId))) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return (id: string) => counts.get(id) ?? 0;
  }, [bookings]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (categoryFilter !== "all" && p.categoryId !== categoryFilter)
          return false;
        if (
          stockFilter !== "all" &&
          getStockStatus(p.stockQuantity, p.minimumStockLevel) !== stockFilter
        )
          return false;
        return true;
      }),
    [products, statusFilter, categoryFilter, stockFilter]
  );

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
              {[p.brand, p.unit].filter(Boolean).join(" · ")}
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
        <span className="text-sm">{categoryName(p.categoryId)}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "price",
      header: "Price",
      cell: (p) => (
        <div className="text-sm">
          <div className="font-medium">{formatCurrency(p.sellingPrice)}</div>
          {p.costPrice !== undefined && (
            <div className="text-[11px] text-muted-foreground">
              Cost {formatCurrency(p.costPrice)}
            </div>
          )}
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
        const stock: StockStatus = getStockStatus(
          p.stockQuantity,
          p.minimumStockLevel
        );
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
              <DropdownMenuItem asChild>
                <Link to={`/products/${p.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
            )}
            {can("products.update") &&
              (p.status === "active" ? (
                <DropdownMenuItem onSelect={() => setProductStatus(p.id, "inactive")}>
                  <PowerOff className="h-4 w-4" />
                  Mark as inactive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setProductStatus(p.id, "active")}>
                  <Power className="h-4 w-4" />
                  Mark as active
                </DropdownMenuItem>
              ))}
            {can("products.delete") && (
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setDeletingId(p.id)}
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
            <Button onClick={() => navigate("/products/add")}>
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          )
        }
      />

      <DataTable<Product>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search products by name, SKU, or brand..."
        searchKeys={["name", "sku", "brand"]}
        rowKey={(p) => p.id}
        toolbar={
          <>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                {STOCK_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Delete product"
        description="This action cannot be undone. The product will be permanently removed from the catalog."
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (!deletingId) return false;
          const result = deleteProduct(deletingId, openRefCounts(deletingId));
          if (!result.ok) {
            toast.error("Cannot delete this product", {
              description: result.error,
            });
            // Keeps the dialog open so the refusal stays attached to the action
            // the admin just took.
            return false;
          }
          setDeletingId(null);
          return true;
        }}
      />
    </div>
  );
}
