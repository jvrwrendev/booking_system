import { useMemo, useRef, useState } from "react";
import { Package } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormSection,
  FormField,
  FormFooter,
} from "@/components/common/FormPageLayout";
import { ImageUpload } from "@/components/common/ImageUpload";

import type { Product, ProductFormValues } from "@/types/product";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { DEFAULT_PRODUCT_UNIT, PRODUCT_UNITS } from "@/lib/constants";
import type { ProductFormErrors } from "../lib/validation";

interface ProductFormProps {
  initial?: Product;
  submitLabel?: string;
  errors?: ProductFormErrors;
  /**
   * `openedStockQuantity` is the stock count the form was opened with, taken
   * from the same snapshot the field values came from. Edits must be applied as
   * a difference from it, otherwise a deduction committed while the form was
   * open would be undone by saving an unrelated field.
   */
  onSubmit: (
    data: ProductFormValues,
    openedStockQuantity: number | undefined
  ) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

function toFormValues(initial?: Product): ProductFormValues {
  return initial
    ? {
        name: initial.name,
        sku: initial.sku,
        categoryId: initial.categoryId,
        description: initial.description,
        unit: initial.unit,
        sellingPrice: initial.sellingPrice,
        stockQuantity: initial.stockQuantity,
        minimumStockLevel: initial.minimumStockLevel,
        status: initial.status,
        image: initial.image,
        // Optional commercial details are normalized to empty form values.
        brand: initial.brand ?? "",
        costPrice: initial.costPrice ?? 0,
        supplier: initial.supplier ?? "",
      }
    : {
        name: "",
        sku: "",
        categoryId: "",
        brand: "",
        description: "",
        unit: DEFAULT_PRODUCT_UNIT,
        costPrice: 0,
        sellingPrice: 0,
        stockQuantity: 0,
        minimumStockLevel: 0,
        supplier: "",
        status: "active",
      };
}

export function ProductForm({
  initial,
  submitLabel,
  errors = {},
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
}: ProductFormProps) {
  const { categories, activeCategories } = useCategoriesStore();
  const [values, setValues] = useState<ProductFormValues>(() =>
    toFormValues(initial)
  );
  // Captured from the same `initial` snapshot the state above was built from,
  // and never re-read: the catalog can change underneath an open form, and the
  // live value would no longer describe what the admin is looking at.
  const openedStockQuantity = useRef(initial?.stockQuantity);

  // A product already assigned to a deactivated category must stay editable, so
  // its current category is offered even though new products cannot pick it.
  const categoryOptions = useMemo(() => {
    if (initial && !activeCategories.some((c) => c.id === initial.categoryId)) {
      const current = categories.find((c) => c.id === initial.categoryId);
      if (current) return [...activeCategories, current];
    }
    return activeCategories;
  }, [activeCategories, categories, initial]);

  const margin =
    values.sellingPrice > 0 ? values.sellingPrice - values.costPrice : 0;
  const marginPercent =
    values.costPrice > 0 ? Math.round((margin / values.costPrice) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values, openedStockQuantity.current);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-12">
      <FormSection
        title="Product image"
        description="Upload a photo of the product. Shown in listings and detail views."
      >
        <div className="flex items-start gap-6">
          <div className="flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40">
            <ImageUpload
              value={values.image}
              onChange={(img) => setValues((v) => ({ ...v, image: img }))}
            />
          </div>
          <div className="min-w-0 space-y-2 pt-1">
            <p className="text-sm font-medium">Product photo</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max 5MB. Square format recommended.
            </p>
            {!values.image && (
              <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <Package className="h-6 w-6" />
                  <span className="text-[10px]">No image</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Product information"
        description="Name, identifier, and classification details."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Product name"
            required
            htmlFor="name"
            error={errors.name}
          >
            <Input
              id="name"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="Dewormer 100ml"
              className="h-10"
            />
          </FormField>
          <FormField
            label="SKU"
            required
            htmlFor="sku"
            hint="Must be unique. Auto-uppercased."
            error={errors.sku}
          >
            <Input
              id="sku"
              value={values.sku}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  sku: e.target.value.toUpperCase(),
                }))
              }
              placeholder="VET-DWM-001"
              className="h-10 font-mono"
            />
          </FormField>
          <FormField
            label="Category"
            required
            htmlFor="category"
            error={errors.categoryId}
          >
            <Select
              value={values.categoryId}
              onValueChange={(v) =>
                setValues((s) => ({ ...s, categoryId: v }))
              }
            >
              <SelectTrigger id="category" className="h-10">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.status === "inactive" ? " (inactive)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Brand" optional htmlFor="brand">
            <Input
              id="brand"
              value={values.brand}
              onChange={(e) =>
                setValues((v) => ({ ...v, brand: e.target.value }))
              }
              placeholder="Brand name"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Unit"
            required
            htmlFor="unit"
            error={errors.unit}
            hint="How the product is sold and counted."
          >
            <Select
              value={values.unit}
              onValueChange={(v) => setValues((s) => ({ ...s, unit: v }))}
            >
              <SelectTrigger id="unit" className="h-10">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Supplier" optional htmlFor="supplier">
            <Input
              id="supplier"
              value={values.supplier}
              onChange={(e) =>
                setValues((v) => ({ ...v, supplier: e.target.value }))
              }
              placeholder="Supplier name"
              className="h-10"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Pricing"
        description="Set the cost and selling price for this product."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Cost price (₱)"
            optional
            htmlFor="costPrice"
            hint="Used for margin and inventory value."
            error={errors.costPrice}
          >
            <Input
              id="costPrice"
              type="number"
              min={0}
              step={0.01}
              value={values.costPrice || ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  costPrice: Number(e.target.value) || 0,
                }))
              }
              className="h-10"
            />
          </FormField>
          <FormField
            label="Selling price (₱)"
            required
            htmlFor="sellingPrice"
            hint="The price customers pay per unit."
            error={errors.sellingPrice}
          >
            <Input
              id="sellingPrice"
              type="number"
              min={0}
              step={0.01}
              value={values.sellingPrice || ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  sellingPrice: Number(e.target.value) || 0,
                }))
              }
              className="h-10"
            />
          </FormField>
          <FormField
            label="Margin"
            optional
            htmlFor="margin"
            className="pointer-events-none"
          >
            <Input
              id="margin"
              readOnly
              value={
                values.costPrice > 0
                  ? `₱${margin.toFixed(2)} (${marginPercent}%)`
                  : "—"
              }
              className="h-10 bg-muted/40"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Inventory"
        description="Current stock levels and minimum thresholds."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Stock quantity"
            required
            htmlFor="stockQuantity"
            hint="Current units in stock."
            error={errors.stockQuantity}
          >
            <Input
              id="stockQuantity"
              type="number"
              min={0}
              value={values.stockQuantity || ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  stockQuantity: Number(e.target.value) || 0,
                }))
              }
              className="h-10"
            />
          </FormField>
          <FormField
            label="Minimum stock level"
            optional
            htmlFor="minimumStockLevel"
            hint="Triggers the low stock alert. Leave 0 to disable it."
            error={errors.minimumStockLevel}
          >
            <Input
              id="minimumStockLevel"
              type="number"
              min={0}
              value={values.minimumStockLevel || ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  minimumStockLevel: Number(e.target.value) || 0,
                }))
              }
              className="h-10"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Description"
        description="Optional details about the product's features, usage, or specifications."
      >
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) =>
            setValues((v) => ({ ...v, description: e.target.value }))
          }
          rows={3}
          placeholder="A short description of the product..."
          className="resize-none"
        />
      </FormSection>

      <FormSection
        title="Status"
        description="Control whether this product is visible and available for new bookings."
      >
        <div className="max-w-xs">
          <Select
            value={values.status}
            onValueChange={(v) =>
              setValues((s) => ({
                ...s,
                status: v as Product["status"],
              }))
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormSection>

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create product")}
        />
      )}
    </form>
  );
}
