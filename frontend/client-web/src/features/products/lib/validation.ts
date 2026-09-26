import type { Category, CategoryFormValues } from "@/types/category";
import type { Product, ProductFormValues } from "@/types/product";

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;
export type CategoryFormErrors = Partial<Record<keyof CategoryFormValues, string>>;

/**
 * Rejects non-finite values as well as negatives. `Infinity` passes a plain
 * `< 0` test, and it would survive in memory but serialize to `null` on the
 * next write, quietly turning a live product into one with no stock.
 */
const isNegative = (value: number) => !Number.isFinite(value) || value < 0;

/**
 * Validates the product form. `editingId` is excluded from the uniqueness
 * checks so a product does not clash with itself when being edited.
 */
export function validateProductForm(
  values: ProductFormValues,
  products: Product[],
  editingId?: string
): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const name = values.name.trim();
  const sku = values.sku.trim().toUpperCase();

  if (!name) errors.name = "Product name is required.";
  if (!sku) errors.sku = "SKU is required.";
  if (!values.categoryId) errors.categoryId = "Category is required.";
  if (!values.unit.trim()) errors.unit = "Unit is required.";

  if (isNegative(values.sellingPrice)) {
    errors.sellingPrice = "Selling price must be 0 or greater.";
  }
  if (isNegative(values.costPrice)) {
    errors.costPrice = "Cost price must be 0 or greater.";
  }
  if (isNegative(values.stockQuantity)) {
    errors.stockQuantity = "Stock quantity cannot be negative.";
  }
  if (isNegative(values.minimumStockLevel)) {
    errors.minimumStockLevel = "Minimum stock level cannot be negative.";
  }

  if (sku) {
    const clash = products.find(
      (p) => p.id !== editingId && p.sku.trim().toUpperCase() === sku
    );
    if (clash) errors.sku = `SKU ${sku} is already used by "${clash.name}".`;
  }

  if (name && values.categoryId) {
    const clash = products.find(
      (p) =>
        p.id !== editingId &&
        p.categoryId === values.categoryId &&
        p.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (clash) errors.name = `"${clash.name}" already exists in this category.`;
  }

  return errors;
}

export function validateCategoryForm(
  values: CategoryFormValues,
  categories: Category[],
  editingId?: string
): CategoryFormErrors {
  const name = values.name.trim();
  if (!name) return { name: "Category name is required." };

  const clash = categories.find(
    (c) => c.id !== editingId && c.name.trim().toLowerCase() === name.toLowerCase()
  );
  return clash ? { name: `A category named "${clash.name}" already exists.` } : {};
}

export function hasErrors<T extends object>(errors: T): boolean {
  return Object.keys(errors).length > 0;
}
