import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Edit,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { getStatusVariant, humanize } from "@/lib/status";

import { usePermissions } from "@/hooks/usePermissions";
import type { Supplier } from "@/types/supplier";
import { useSuppliersStore } from "../hooks/useSuppliersStore";
import { SupplierAddDialog } from "../components/SupplierAddDialog";

export function SuppliersListPage() {
  const { can } = usePermissions();
  const {
    suppliers,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setSearch,
    setStatusFilter,
    setPage,
    setPageSize,
    refresh,
    removeSupplier,
    addSupplier,
  } = useSuppliersStore();

  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const columns: DataTableColumn<Supplier>[] = [
    {
      id: "name",
      header: "Supplier",
      cell: (supplier) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{supplier.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {supplier.address || "No address on file"}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name",
    },
    {
      id: "contact",
      header: "Contact person",
      cell: (supplier) => (
        <div className="flex items-center gap-1.5 text-sm">
          {supplier.contactName ? (
            <>
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{supplier.contactName}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "phone",
      header: "Contact number",
      cell: (supplier) => (
        <div className="flex items-center gap-1.5 text-sm">
          {supplier.contactNumber ? (
            <>
              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{supplier.contactNumber}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "products",
      header: "Products",
      cell: (supplier) => (
        <Link
          to={`/products?search=${encodeURIComponent(supplier.name)}`}
          className="text-sm font-medium hover:text-primary"
        >
          {supplier.productCount}
        </Link>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "status",
      header: "Status",
      cell: (supplier) => (
        <StatusBadge
          variant={getStatusVariant(supplier.status)}
          label={humanize(supplier.status)}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (supplier) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={`Actions for ${supplier.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/products?search=${encodeURIComponent(supplier.name)}`}>
                <Building2 className="h-4 w-4" />
                View products
              </Link>
            </DropdownMenuItem>
            {can("suppliers.update") && (
              <DropdownMenuItem asChild>
                <Link to={`/suppliers/${supplier.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit supplier
                </Link>
              </DropdownMenuItem>
            )}
            {can("suppliers.delete") && (
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setDeleting(supplier)}
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
        title="Suppliers"
        description="Manage the suppliers that products can be linked to."
        breadcrumbs={[{ label: "Operations" }, { label: "Suppliers" }]}
        actions={
          can("suppliers.create") && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          )
        }
      />

      <DataTable<Supplier>
        data={suppliers}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void refresh()}
        searchPlaceholder="Search suppliers by name, contact person, or phone..."
        rowKey={(supplier) => supplier.id}
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
            title={filters.search || filters.status !== "all"
              ? "No suppliers match your filters"
              : "No suppliers yet"}
            description={filters.search || filters.status !== "all"
              ? "Try a different search term or clear the filters."
              : "Add your first supplier so products can be linked to it."}
          />
        }
        toolbar={
          <Select value={filters.status} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <SupplierAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addSupplier}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete supplier"
        description={
          deleting
            ? `${deleting.name} will be removed. Products linked to it will become unassigned and keep their other details.`
            : ""
        }
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting.id;
          setDeleting(null);
          await removeSupplier(id).catch(() => {});
        }}
      />
    </div>
  );
}
