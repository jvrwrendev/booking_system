import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { SupplierPicker } from "@/features/suppliers/components/SupplierPicker";

import type { Product, ProductFormValues } from "@/types/product";
import type { Category } from "@/types/category";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  initial?: Product;
  categories: Category[];
  submitLabel?: string;
  onSubmit: (data: ProductFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
  dense?: boolean;
}

export function ProductForm({
  initial,
  categories,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
  dense = false,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(
    initial
      ? {
          name: initial.name,
          sku: initial.sku,
          categoryId: initial.categoryId,
          supplierId: initial.supplierId ?? "",
          supplierName: initial.supplierName,
          brand: initial.brand,
          description: initial.description,
          unit: initial.unit,
          costPrice: initial.costPrice,
          sellingPrice: initial.sellingPrice,
          stockQuantity: initial.stockQuantity,
          minimumStockLevel: initial.minimumStockLevel,
          status: initial.status,
          image: initial.image,
        }
      : {
          name: "",
          sku: "",
          categoryId: "",
          supplierId: "",
          brand: "",
          description: "",
          unit: "piece",
          costPrice: 0,
          sellingPrice: 0,
          stockQuantity: 0,
          minimumStockLevel: 0,
          status: "active",
        }
  );
  const [error, setError] = useState<string | null>(null);

  const margin =
    values.sellingPrice > 0
      ? values.sellingPrice - values.costPrice
      : 0;
  const marginPercent =
    values.costPrice > 0
      ? Math.round((margin / values.costPrice) * 100)
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!values.sku.trim()) {
      setError("SKU is required.");
      return;
    }
    if (!values.categoryId) {
      setError("Select a category for this product.");
      return;
    }
    if (!values.unit.trim()) {
      setError("Unit is required.");
      return;
    }
    if (values.costPrice < 0 || values.sellingPrice < 0) {
      setError("Prices cannot be negative.");
      return;
    }
    setError(null);
    onSubmit(values);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn(dense && "space-y-6", !dense && "space-y-12")}
    >
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FormSection
        title="Product image"
        description="Upload a photo of the product. Shown in listings and detail views."
      >
        <div className="flex flex-wrap items-start gap-6">
          <ImageUpload
            value={values.image}
            onChange={(img) => setValues((v) => ({ ...v, image: img }))}
            aspect={dense ? "square" : "square"}
          />
          <div className="min-w-0 flex-1 space-y-1.5 pt-1">
            <p className="text-sm font-medium text-foreground">Product photo</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max 5MB. Square format recommended.
            </p>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Product information"
        description="Name, identifier, and classification details."
      >
        <div
          className={cn(
            "grid gap-5 sm:grid-cols-2",
            !dense && "lg:grid-cols-3"
          )}
        >
          <FormField label="Product name" required htmlFor="name">
            <Input
              id="name"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="Premium Hog Feed"
              className="h-10"
            />
          </FormField>
          <FormField
            label="SKU"
            required
            htmlFor="sku"
            hint="Will be auto-uppercased."
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
              placeholder="FEED-HOG-001"
              className="h-10 font-mono"
            />
          </FormField>
          <FormField label="Category" required htmlFor="category">
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
                {categories.map((c) => (
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
          <FormField label="Unit" optional htmlFor="unit">
            <Input
              id="unit"
              value={values.unit}
              onChange={(e) =>
                setValues((v) => ({ ...v, unit: e.target.value }))
              }
              placeholder="50 kg sack"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Supplier"
            optional
            htmlFor="supplier"
            hint="Choose from Supplier Management, or leave blank."
          >
            <SupplierPicker
              id="supplier"
              value={values.supplierId}
              selectedName={values.supplierName}
              onChange={(supplierId, supplierName) =>
                setValues((v) => ({ ...v, supplierId, supplierName }))
              }
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Pricing"
        description="Set the cost and selling price for this product."
      >
        <div
          className={cn(
            "grid gap-5 sm:grid-cols-2",
            !dense && "lg:grid-cols-3"
          )}
        >
          <FormField
            label="Cost price (₱)"
            required
            htmlFor="costPrice"
            hint="The amount you pay per unit."
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
          <FormField label="Margin" optional htmlFor="margin" className="pointer-events-none">
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
        <div
          className={cn(
            "grid gap-5 sm:grid-cols-2",
            !dense && "lg:grid-cols-3"
          )}
        >
          <FormField
            label="Stock quantity"
            required
            htmlFor="stockQuantity"
            hint="Current units in stock."
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
            hint="Trigger reorder alert when stock falls below this."
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
        <FormField label="Description" optional htmlFor="description">
          <Textarea
            id="description"
            value={values.description}
            onChange={(e) =>
              setValues((v) => ({ ...v, description: e.target.value }))
            }
            rows={3}
            placeholder="A short description of the product…"
            className="resize-none"
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Status"
        description="Control whether this product is visible and available for bookings."
      >
        <FormField label="Status" htmlFor="status" className="max-w-xs">
          <Select
            value={values.status}
            onValueChange={(v) =>
              setValues((s) => ({
                ...s,
                status: v as Product["status"],
              }))
            }
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
