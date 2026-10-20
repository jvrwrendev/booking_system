import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, MoreHorizontal, Plus, Tags, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { toast } from "sonner";

import type { Category, CategoryFormValues } from "@/types/category";
import { formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { mockProducts } from "@/data/mock-products";

const initialForm: CategoryFormValues = {
  name: "",
  description: "",
  status: "active",
};

export function CategoriesListPage() {
  const { can } = usePermissions();
  const [categories, setCategories] = useState<Category[]>(() =>
    computeInitial()
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [values, setValues] = useState<CategoryFormValues>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const productCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of mockProducts) {
      counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;
    }
    return counts;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (editing) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? { ...c, ...values, productCount: productCountByCategory[c.id] ?? c.productCount }
            : c
        )
      );
      toast.success("Category updated");
    } else {
      const newId = `CAT-${String(categories.length + 1).padStart(3, "0")}`;
      setCategories((prev) => [
        ...prev,
        {
          id: newId,
          ...values,
          productCount: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      toast.success("Category created");
    }
    setFormOpen(false);
    setEditing(null);
    setValues(initialForm);
    setError(null);
  };

  const openCreate = () => {
    setEditing(null);
    setValues(initialForm);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setValues({
      name: category.name,
      description: category.description,
      status: category.status,
    });
    setError(null);
    setFormOpen(true);
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
          {c.productCount}
        </Link>
      ),
      sortable: true,
      sortKey: "productCount",
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
        searchPlaceholder="Search categories..."
        searchKeys={["name", "description"]}
        rowKey={(c) => c.id}
      />

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="categoryName">Name *</Label>
              <Input
                id="categoryName"
                value={values.name}
                onChange={(e) =>
                  setValues((v) => ({ ...v, name: e.target.value }))
                }
                placeholder="e.g., Fertilizers"
              />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
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
        description="This will remove the category. Products will keep their existing references but appear uncategorized."
        confirmText="Delete"
        destructive
        onConfirm={() => {
          setCategories((prev) => prev.filter((c) => c.id !== deletingId));
          setDeletingId(null);
          toast.success("Category deleted");
        }}
      />
    </div>
  );
}

function computeInitial(): Category[] {
  return [
    {
      id: "CAT-001",
      name: "Feeds",
      description: "Animal and livestock feeds including poultry, hog, and cattle.",
      productCount: 5,
      status: "active",
      createdAt: "2024-01-15T08:00:00Z",
    },
    {
      id: "CAT-002",
      name: "Fertilizers",
      description: "Organic and inorganic fertilizers for crops and soil.",
      productCount: 3,
      status: "active",
      createdAt: "2024-01-15T08:00:00Z",
    },
    {
      id: "CAT-003",
      name: "Pesticides",
      description: "Insecticides and pest control products.",
      productCount: 3,
      status: "active",
      createdAt: "2024-02-01T08:00:00Z",
    },
    {
      id: "CAT-004",
      name: "Veterinary Products",
      description: "Medicines, vitamins, and supplements for animals.",
      productCount: 3,
      status: "active",
      createdAt: "2024-02-01T08:00:00Z",
    },
    {
      id: "CAT-005",
      name: "Seeds",
      description: "Quality seeds for rice, corn, vegetables, and other crops.",
      productCount: 2,
      status: "active",
      createdAt: "2024-03-12T08:00:00Z",
    },
    {
      id: "CAT-006",
      name: "Tools",
      description: "Hand tools and small farm implements.",
      productCount: 3,
      status: "active",
      createdAt: "2024-03-12T08:00:00Z",
    },
    {
      id: "CAT-007",
      name: "Equipment",
      description: "Farm equipment and machinery.",
      productCount: 2,
      status: "active",
      createdAt: "2024-04-02T08:00:00Z",
    },
    {
      id: "CAT-008",
      name: "Farm Supplies",
      description: "General farm supplies, accessories, and consumables.",
      productCount: 0,
      status: "inactive",
      createdAt: "2024-04-02T08:00:00Z",
    },
  ];
}