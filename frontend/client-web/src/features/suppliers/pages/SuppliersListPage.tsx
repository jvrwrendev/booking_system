import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Edit,
  Mail,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  StatusBadge,
  getStatusVariantFromGeneric,
  humanize,
} from "@/components/common/StatusBadge";

import { ApiError } from "@/lib/api-client";
import { usePermissions } from "@/hooks/usePermissions";
import type { Supplier, SupplierFormValues } from "@/types/supplier";
import { useSuppliersStore } from "../hooks/useSuppliersStore";

const EMPTY_FORM: SupplierFormValues = {
  name: "",
  contactName: "",
  email: "",
  contactNumber: "",
  address: "",
  status: "active",
};

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
    addSupplier,
    editSupplier,
    removeSupplier,
  } = useSuppliersStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [values, setValues] = useState<SupplierFormValues>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const openCreate = () => {
    setEditing(null);
    setValues(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setValues({
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      email: supplier.email ?? "",
      contactNumber: supplier.contactNumber ?? "",
      address: supplier.address ?? "",
      status: supplier.status,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }
    if (
      values.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    ) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await editSupplier(editing.id, values);
      } else {
        await addSupplier(values);
      }
      setFormOpen(false);
      setEditing(null);
      setValues(EMPTY_FORM);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Could not save the supplier.",
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Supplier>[] = [
    {
      id: "name",
      header: "Supplier",
      cell: (supplier) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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
      header: "Contact",
      cell: (supplier) => (
        <div className="space-y-0.5 text-sm">
          {supplier.contactName && (
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {supplier.contactName}
            </div>
          )}
          {supplier.contactNumber && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              {supplier.contactNumber}
            </div>
          )}
          {!supplier.contactName && !supplier.contactNumber && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "email",
      header: "Email",
      cell: (supplier) => (
        <span className="flex items-center gap-1.5 text-sm">
          {supplier.email ? (
            <>
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{supplier.email}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
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
          variant={getStatusVariantFromGeneric(supplier.status)}
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
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
              <DropdownMenuItem onSelect={() => openEdit(supplier)}>
                <Edit className="h-4 w-4" />
                Edit
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
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Supplier
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

      <DataTable<Supplier>
        data={suppliers}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search suppliers by name, contact, email, or phone..."
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
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium">
              {filters.search || filters.status !== "all"
                ? "No suppliers match your filters"
                : "No suppliers yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filters.search || filters.status !== "all"
                ? "Try a different search term or clear the filters."
                : "Add your first supplier so products can be linked to it."}
            </p>
          </div>
        }
        toolbar={
          <Select value={filters.status} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
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

      <Dialog
        open={formOpen}
        onOpenChange={(next) => {
          if (saving) return;
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit supplier" : "Add supplier"}
            </DialogTitle>
            <DialogDescription>
              Suppliers can be linked to products and selected when adding a
              product.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="supplier-name">Supplier name *</Label>
              <Input
                id="supplier-name"
                value={values.name}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="e.g., NutriGrow Philippines"
                disabled={saving}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="supplier-contact">Contact person</Label>
                <Input
                  id="supplier-contact"
                  value={values.contactName}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      contactName: event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier-phone">Contact number</Label>
                <Input
                  id="supplier-phone"
                  value={values.contactNumber}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      contactNumber: event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, email: event.target.value }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-address">Address</Label>
              <Textarea
                id="supplier-address"
                value={values.address}
                onChange={(event) =>
                  setValues((prev) => ({
                    ...prev,
                    address: event.target.value,
                  }))
                }
                rows={2}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(next) =>
                  setValues((prev) => ({
                    ...prev,
                    status: next as Supplier["status"],
                  }))
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Create supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
