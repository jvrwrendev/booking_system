import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Edit,
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  Tags,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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

import type { Category, CategoryFormValues } from "@/types/category";
import { formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import {
  countProductsInCategory,
  useCategoriesStore,
} from "../hooks/useCategoriesStore";
import { useProductsStore } from "@/features/products/hooks/useProductsStore";
import {
  hasErrors,
  validateCategoryForm,
  type CategoryFormErrors,
} from "@/features/products/lib/validation";

const emptyForm: CategoryFormValues = {
  name: "",
  description: "",
  status: "active",
};

export function CategoriesListPage() {
  const { can } = usePermissions();
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    setCategoryStatus,
  } = useCategoriesStore();
  const { products } = useProductsStore();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [values, setValues] = useState<CategoryFormValues>(emptyForm);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Product counts are derived from the products store so they stay correct
  // when a product is created, reassigned, or deleted.
  const productCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const filtered = useMemo(
    () =>
      categories.filter(
        (c) => statusFilter === "all" || c.status === statusFilter
      ),
    [categories, statusFilter]
  );

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setValues(emptyForm);
    setErrors({});
  };

  const openCreate = () => {
    setEditing(null);
    setValues(emptyForm);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setValues({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErrors = validateCategoryForm(
      values,
      categories,
      editing?.id
    );
    if (hasErrors(fieldErrors)) {
      setErrors(fieldErrors);
      return;
    }
    if (editing) updateCategory(editing.id, values);
    else addCategory(values);
    closeForm();
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
              {c.description}
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
          {productCountByCategory.get(c.id) ?? 0}
        </Link>
      ),
      sortable: true,
      sortKey: "name",
      className: "hidden md:table-cell",
    },
    {
      id: "status",
      header: "Status",
      cell: (c) => (
        <StatusBadge
          variant={getStatusVariantFromGeneric(c.status)}
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
      sortable: true,
      sortKey: "createdAt",
      className: "hidden md:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
            {can("categories.update") &&
              (c.status === "active" ? (
                <DropdownMenuItem
                  onSelect={() => setCategoryStatus(c.id, "inactive")}
                >
                  <PowerOff className="h-4 w-4" />
                  Mark as inactive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onSelect={() => setCategoryStatus(c.id, "active")}
                >
                  <Power className="h-4 w-4" />
                  Mark as active
                </DropdownMenuItem>
              ))}
            {can("categories.delete") && (
              <DropdownMenuItem
                className="text-destructive"
                onSelect={() => setDeletingId(c.id)}
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

  const deletingCategory = deletingId
    ? categories.find((c) => c.id === deletingId)
    : undefined;
  const deletingProductCount = deletingId
    ? countProductsInCategory(products, deletingId)
    : 0;

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
        data={filtered}
        columns={columns}
        searchPlaceholder="Search categories..."
        searchKeys={["name", "description"]}
        rowKey={(c) => c.id}
        toolbar={
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
        }
      />

      <Dialog
        open={formOpen}
        onOpenChange={(o) => (o ? setFormOpen(true) : closeForm())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              Categories help organize your product catalog.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="categoryName">Name *</Label>
              <Input
                id="categoryName"
                value={values.name}
                onChange={(e) => {
                  setValues((v) => ({ ...v, name: e.target.value }));
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g., Animal Health"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="categoryDesc">Description</Label>
              <Textarea
                id="categoryDesc"
                value={values.description}
                onChange={(e) =>
                  setValues((v) => ({ ...v, description: e.target.value }))
                }
                rows={3}
                placeholder="Short description"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues((s) => ({
                    ...s,
                    status: v as Category["status"],
                  }))
                }
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
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editing ? "Save changes" : "Create category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Delete category"
        description={
          deletingProductCount > 0
            ? `"${deletingCategory?.name}" still has ${deletingProductCount} ${
                deletingProductCount === 1 ? "product" : "products"
              } assigned. Move or delete them before removing this category.`
            : `This permanently removes "${deletingCategory?.name}". This action cannot be undone.`
        }
        confirmText="Delete"
        destructive
        onConfirm={() => {
          if (!deletingId) return;
          const result = deleteCategory(deletingId, deletingProductCount);
          if (!result.ok) toast.error("Category cannot be deleted", {
            description: result.error,
          });
          setDeletingId(null);
        }}
      />
    </div>
  );
}
