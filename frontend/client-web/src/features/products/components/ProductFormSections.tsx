import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/common/FormPageLayout";
import { ImageUpload } from "@/components/common/ImageUpload";
import { SupplierPicker } from "@/features/suppliers/components/SupplierPicker";

import type { Category } from "@/types/category";
import type { Product, ProductFormValues } from "@/types/product";
import type { FieldErrors } from "@/lib/validation";
import type { ProductField } from "../lib/productValidation";

/**
 * Controlled building blocks for the product form.
 *
 * The add wizard renders one section per step and the edit dialog renders
 * them all in sequence, so the fields are defined exactly once.
 */
export interface ProductSectionProps {
  values: ProductFormValues;
  onChange: <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) => void;
  errors?: FieldErrors<ProductField>;
  categories?: Category[];
}

/** Image, identity and classification. */
export function ProductDetailsSection({
  values,
  onChange,
  errors,
  categories = [],
}: ProductSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start gap-5">
        <ImageUpload
          value={values.image}
          onChange={(img) => onChange("image", img)}
          aspect="square"
        />
        <div className="min-w-0 flex-1 space-y-1 pt-1">
          <p className="text-sm font-medium text-foreground">Product photo</p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or GIF, max 5 MB. Square format recommended.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="Product name"
          required
          htmlFor="name"
          error={errors?.name}
        >
          <Input
            id="name"
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Premium Hog Feed"
            aria-invalid={!!errors?.name}
            className="h-10"
          />
        </FormField>
        <FormField
          label="SKU"
          required
          htmlFor="sku"
          hint="Will be auto-uppercased."
          error={errors?.sku}
        >
          <Input
            id="sku"
            value={values.sku}
            onChange={(e) => onChange("sku", e.target.value.toUpperCase())}
            placeholder="FEED-HOG-001"
            aria-invalid={!!errors?.sku}
            className="h-10 font-mono"
          />
        </FormField>
        <FormField
          label="Category"
          required
          htmlFor="category"
          error={errors?.categoryId}
        >
          <Select
            value={values.categoryId}
            onValueChange={(v) => onChange("categoryId", v)}
          >
            <SelectTrigger
              id="category"
              className="h-10"
              aria-invalid={!!errors?.categoryId}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                  {c.status === "inactive" ? " (inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          label="Unit"
          required
          htmlFor="unit"
          hint="How the product is sold, e.g. “50 kg sack”."
          error={errors?.unit}
        >
          <Input
            id="unit"
            value={values.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            placeholder="50 kg sack"
            aria-invalid={!!errors?.unit}
            className="h-10"
          />
        </FormField>
        <FormField label="Brand" optional htmlFor="brand">
          <Input
            id="brand"
            value={values.brand}
            onChange={(e) => onChange("brand", e.target.value)}
            placeholder="Brand name"
            className="h-10"
          />
        </FormField>
      </div>
    </div>
  );
}

/** Cost, selling price and the derived margin. */
export function ProductPricingSection({
  values,
  onChange,
  errors,
}: ProductSectionProps) {
  const margin =
    values.sellingPrice > 0 ? values.sellingPrice - values.costPrice : 0;
  const marginPercent =
    values.costPrice > 0 ? Math.round((margin / values.costPrice) * 100) : 0;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="Cost price (₱)"
        required
        htmlFor="costPrice"
        hint="The amount you pay per unit."
        error={errors?.costPrice}
      >
        <Input
          id="costPrice"
          type="number"
          min={0}
          step={0.01}
          value={values.costPrice || ""}
          onChange={(e) => onChange("costPrice", Number(e.target.value) || 0)}
          aria-invalid={!!errors?.costPrice}
          className="h-10"
        />
      </FormField>
      <FormField
        label="Selling price (₱)"
        required
        htmlFor="sellingPrice"
        hint="The price customers pay per unit."
        error={errors?.sellingPrice}
      >
        <Input
          id="sellingPrice"
          type="number"
          min={0}
          step={0.01}
          value={values.sellingPrice || ""}
          onChange={(e) =>
            onChange("sellingPrice", Number(e.target.value) || 0)
          }
          aria-invalid={!!errors?.sellingPrice}
          className="h-10"
        />
      </FormField>
      <FormField label="Margin" optional htmlFor="margin">
        <Input
          id="margin"
          readOnly
          tabIndex={-1}
          value={
            values.costPrice > 0
              ? `₱${margin.toFixed(2)} (${marginPercent}%)`
              : "—"
          }
          className="h-10 bg-muted/40"
        />
      </FormField>
    </div>
  );
}

/** Opening quantity, reorder threshold and supplier. */
export function ProductStockSection({
  values,
  onChange,
  errors,
}: ProductSectionProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField
        label="Stock quantity"
        required
        htmlFor="stockQuantity"
        hint="Current units in stock."
        error={errors?.stockQuantity}
      >
        <Input
          id="stockQuantity"
          type="number"
          min={0}
          value={values.stockQuantity || ""}
          onChange={(e) =>
            onChange("stockQuantity", Number(e.target.value) || 0)
          }
          aria-invalid={!!errors?.stockQuantity}
          className="h-10"
        />
      </FormField>
      <FormField
        label="Minimum stock level"
        optional
        htmlFor="minimumStockLevel"
        hint="Raise a reorder alert when stock falls below this."
        error={errors?.minimumStockLevel}
      >
        <Input
          id="minimumStockLevel"
          type="number"
          min={0}
          value={values.minimumStockLevel || ""}
          onChange={(e) =>
            onChange("minimumStockLevel", Number(e.target.value) || 0)
          }
          aria-invalid={!!errors?.minimumStockLevel}
          className="h-10"
        />
      </FormField>
      <FormField
        label="Supplier"
        optional
        htmlFor="supplier"
        hint="Choose from Supplier Management, or leave blank."
        className="sm:col-span-2"
      >
        <SupplierPicker
          id="supplier"
          value={values.supplierId}
          selectedName={values.supplierName}
          onChange={(supplierId, supplierName) => {
            onChange("supplierId", supplierId);
            onChange("supplierName", supplierName);
          }}
        />
      </FormField>
    </div>
  );
}

/** Description and catalogue status. */
export function ProductPublishSection({
  values,
  onChange,
}: ProductSectionProps) {
  return (
    <div className="space-y-5">
      <FormField label="Description" optional htmlFor="description">
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => onChange("description", e.target.value)}
          rows={3}
          placeholder="A short description of the product…"
          className="resize-none"
        />
      </FormField>
      <FormField
        label="Status"
        htmlFor="status"
        hint="Inactive and out-of-stock products are hidden from bookings."
        className="max-w-xs"
      >
        <Select
          value={values.status}
          onValueChange={(v) => onChange("status", v as Product["status"])}
        >
          <SelectTrigger id="status" className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="out_of_stock">Out of stock</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </div>
  );
}
