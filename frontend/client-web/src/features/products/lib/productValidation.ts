import { isBlank, type FieldErrors } from "@/lib/validation";
import type { ProductFormValues } from "@/types/product";

/**
 * Fields that can carry a validation message.
 *
 * Keeping this list explicit (rather than `keyof ProductFormValues`) means a
 * typo in a step definition is a compile error.
 */
export type ProductField =
  | "name"
  | "sku"
  | "categoryId"
  | "unit"
  | "costPrice"
  | "sellingPrice"
  | "stockQuantity"
  | "minimumStockLevel";

export type ProductStepId = "details" | "pricing" | "stock" | "review";

export interface ProductStep {
  id: ProductStepId;
  title: string;
  description: string;
  /** Fields validated before the user may leave this step. */
  fields: ProductField[];
}

export const PRODUCT_STEPS: ProductStep[] = [
  {
    id: "details",
    title: "Details",
    description: "Identify the product and file it under a category.",
    fields: ["name", "sku", "categoryId", "unit"],
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Set what the product costs you and what customers pay.",
    fields: ["costPrice", "sellingPrice"],
  },
  {
    id: "stock",
    title: "Stock",
    description: "Opening quantity, the reorder threshold and the supplier.",
    fields: ["stockQuantity"],
  },
  {
    id: "review",
    title: "Review",
    description: "Confirm the details, then create the product.",
    fields: [],
  },
];

/** The rules a single field must satisfy, or `undefined` when it is valid. */
function validateField(
  field: ProductField,
  values: ProductFormValues
): string | undefined {
  switch (field) {
    case "name":
      return isBlank(values.name) ? "Product name is required." : undefined;
    case "sku":
      return isBlank(values.sku) ? "SKU is required." : undefined;
    case "categoryId":
      return isBlank(values.categoryId)
        ? "Select a category for this product."
        : undefined;
    case "unit":
      return isBlank(values.unit) ? "Unit is required." : undefined;
    case "costPrice":
      return values.costPrice < 0 ? "Cost price cannot be negative." : undefined;
    case "sellingPrice":
      return values.sellingPrice < 0
        ? "Selling price cannot be negative."
        : undefined;
    case "stockQuantity":
      return values.stockQuantity < 0
        ? "Stock quantity cannot be negative."
        : undefined;
    case "minimumStockLevel":
      return values.minimumStockLevel < 0
        ? "Minimum stock level cannot be negative."
        : undefined;
    default:
      return undefined;
  }
}

function validateFields(
  fields: ProductField[],
  values: ProductFormValues
): FieldErrors<ProductField> {
  const errors: FieldErrors<ProductField> = {};
  for (const field of fields) {
    const message = validateField(field, values);
    if (message) errors[field] = message;
  }
  return errors;
}

/** Validates only the fields owned by a step. */
export function validateProductStep(
  step: ProductStepId,
  values: ProductFormValues
): FieldErrors<ProductField> {
  const definition = PRODUCT_STEPS.find((s) => s.id === step);
  if (!definition) return {};
  return validateFields(definition.fields, values);
}

/** Validates every field across every step — used on final submit. */
export function validateProduct(
  values: ProductFormValues
): FieldErrors<ProductField> {
  return validateFields(
    PRODUCT_STEPS.flatMap((step) => step.fields),
    values
  );
}

/** The step that owns a field, so a failed submit can jump straight there. */
export function stepForField(field: ProductField): ProductStepId {
  const step = PRODUCT_STEPS.find((s) => s.fields.includes(field));
  return step?.id ?? "details";
}
