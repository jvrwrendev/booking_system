import { useState } from "react";
import { Link } from "react-router-dom";
import { Edit, MoreHorizontal, Plus, Tags, Trash2 } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { FormField } from "@/components/common/FormPageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { getStatusVariant, humanize } from "@/lib/status";

import type { Category, CategoryFormValues } from "@/types/category";
import { formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useCategoriesStore } from "../hooks/useCategoriesStore";
import { ApiError } from "@/lib/api-client";

const initialForm: CategoryFormValues = {
  name: "",
  description: "",
  status: "active",
};

export function CategoriesListPage() {
  const { can } = usePermissions();
  const {
    categories,
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
    addCategory,
    editCategory,
    removeCategory,
  } = useCategoriesStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [values, setValues] = useState<CategoryFormValues>(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const openCreate = () => {
    setEditing(null);
    setValues(initialForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setValues({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setNameError("Category name is required.");
      setFormError(null);
      return;
    }
    setNameError(null);
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await editCategory(editing.id, values);
      } else {
        await addCategory(values);
      }
      setFormOpen(false);
      setEditing(null);
      setValues(initialForm);
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Could not save the category.",
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: DataTableColumn<Category>[] = [
    {
      id: "name",
      header: "Category",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Tags className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-medium">{c.name}</div>
            <div className="line-clamp-1 text-xs text-muted-foreground">
              {c.description || "No description"}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name",
    },
    {
      id: "products",
      header: "Products",
      cell: (c) => (
        <Link
          to={`/products?category=${c.id}`}
          className="text-sm font-medium hover:text-primary"
        >
          {c.productCount}
        </Link>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "status",
      header: "Status",
      cell: (c) => (
        <StatusBadge
          variant={getStatusVariant(c.status)}
          label={humanize(c.status)}
        />
      ),
    },
    {
      id: "created",
      header: "Created",
      cell: (c) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(c.createdAt)}
        </span>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={`Actions for ${c.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/products?category=${c.id}`}>
                <Tags className="h-4 w-4" />
                View products
              </Link>
            </DropdownMenuItem>
            {can("categories.update") && (
              <DropdownMenuItem onSelect={() => openEdit(c)}>
                <Edit className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}
            {can("categories.delete") && (
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setDeleting(c)}
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
        title="Categories"
        description="Organize products into logical categories."
        breadcrumbs={[{ label: "Operations" }, { label: "Categories" }]}
        actions={
          can("categories.create") && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          )
        }
      />

      <DataTable<Category>
        data={categories}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={() => void refresh()}
        searchPlaceholder="Search categories..."
        rowKey={(c) => c.id}
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
              ? "No categories match your filters"
              : "No categories yet"}
            description={filters.search || filters.status !== "all"
              ? "Try a different search term or clear the filters."
              : "Create a category to start organizing products."}
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

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          if (saving) return;
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              Categories help organize your product catalog.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <FormField
              label="Name"
              required
              htmlFor="categoryName"
              error={nameError ?? undefined}
            >
              <Input
                id="categoryName"
                value={values.name}
                onChange={(e) => {
                  setValues((v) => ({ ...v, name: e.target.value }));
                  setNameError(null);
                }}
                placeholder="e.g., Fertilizers"
                aria-invalid={!!nameError}
              />
            </FormField>
            <FormField label="Description" optional htmlFor="categoryDesc">
              <Textarea
                id="categoryDesc"
                value={values.description}
                onChange={(e) =>
                  setValues((v) => ({ ...v, description: e.target.value }))
                }
                rows={3}
                placeholder="Short description"
              />
            </FormField>
            <FormField label="Status" htmlFor="categoryStatus">
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues((s) => ({
                    ...s,
                    status: v as Category["status"],
                  }))
                }
              >
                <SelectTrigger id="categoryStatus" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
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
                    : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete category"
        description="This will remove the category. Products will keep their existing references but appear uncategorized."
        confirmText="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting.id;
          setDeleting(null);
          await removeCategory(id).catch(() => {});
        }}
      />
    </div>
  );
}
