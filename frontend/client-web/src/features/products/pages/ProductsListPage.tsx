import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Package, Plus, Trash2, Pencil } from "lucide-react";

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
import type { Product } from "@/types/product";
import { getProductStockStatus } from "@/types/product";
import { mockCategories } from "@/data/mock-categories";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function ProductsListPage() {
  const { products, deleteProduct } = useProductsStore();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (categoryFilter !== "all" && p.categoryId !== categoryFilter)
        return false;
      return true;
    });
  }, [products, statusFilter, categoryFilter]);

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
              {p.brand} · {p.unit}
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
      cell: (p) => {
        const cat = mockCategories.find((c) => c.id === p.categoryId);
        return <span className="text-sm">{cat?.name ?? "Uncategorized"}</span>;
      },
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
      cell: (p) => {
        return (
          <div className="text-sm">
            <div className="font-medium">{p.stockQuantity}</div>
            <div className="text-[11px] text-muted-foreground">
              Min {p.minimumStockLevel}
            </div>
          </div>
        );
      },
      sortable: true,
      sortKey: "stockQuantity",
    },
    {
      id: "status",
      header: "Status",
      cell: (p) => {
        const stock = getProductStockStatus(p);
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
                {mockCategories.map((c) => (
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
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
          if (deletingId) deleteProduct(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
