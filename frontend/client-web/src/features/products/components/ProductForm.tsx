import { useState } from "react";
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
import { mockCategories } from "@/data/mock-categories";
import { cn } from "@/lib/utils";

interface ProductFormProps {
  initial?: Product;
  submitLabel?: string;
  onSubmit: (data: ProductFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
  dense?: boolean;
}

export function ProductForm({
  initial,
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
          brand: initial.brand,
          description: initial.description,
          unit: initial.unit,
          costPrice: initial.costPrice,
          sellingPrice: initial.sellingPrice,
          stockQuantity: initial.stockQuantity,
          minimumStockLevel: initial.minimumStockLevel,
          supplier: initial.supplier,
          status: initial.status,
          image: initial.image,
        }
      : {
          name: "",
          sku: "",
          categoryId: "",
          brand: "",
          description: "",
          unit: "piece",
          costPrice: 0,
          sellingPrice: 0,
          stockQuantity: 0,
          minimumStockLevel: 0,
          supplier: "",
          status: "active",
        }
  );

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
    onSubmit(values);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn(dense && "space-y-6", !dense && "space-y-12")}
    >
      <FormSection
        title="Product image"
        description="Upload a photo of the product. Shown in listings and detail views."
      >
        <div className="flex items-start gap-6">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/40",
              dense ? "h-32 w-32" : "h-40 w-40"
            )}
          >
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
                {mockCategories
                  .filter((c) => c.status === "active")
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
        description="Control whether this product is visible and available for bookings."
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
              <SelectItem value="out_of_stock">Out of stock</SelectItem>
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
