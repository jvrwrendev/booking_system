import { z } from "zod";

const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "OUT_OF_STOCK"] as const;
const STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "CRITICAL",
  "OUT_OF_STOCK",
] as const;

const imageSchema = z
  .string()
  .trim()
  .max(7_000_000, "Image is too large")
  .refine(
    (value) =>
      /^https?:\/\/\S+$/i.test(value) ||
      /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/i.test(value),
    "Image must be an http(s) URL or a base64 image data URL",
  );

export const productParamsDto = z.object({
  id: z.string().min(1, "Product id is required").max(100),
});

export const listProductsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  categoryId: z.string().trim().max(100).optional(),
  status: z.enum(PRODUCT_STATUSES).optional(),
  stockStatus: z.enum(STOCK_STATUSES).optional(),
  sortBy: z
    .enum(["name", "sku", "sellingPrice", "stockQuantity", "updatedAt", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createProductDto = z.object({
  name: z.string().trim().min(1, "Product name is required").max(255),
  sku: z
    .string()
    .trim()
    .min(1, "SKU is required")
    .max(80)
    .transform((value) => value.toUpperCase()),
  categoryId: z.string().trim().max(100).nullable().optional(),
  brand: z.string().trim().max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  unit: z.string().trim().min(1, "Unit is required").max(60).default("piece"),
  costPrice: z.coerce.number().min(0, "Cost price cannot be negative").max(99_999_999),
  sellingPrice: z
    .coerce.number()
    .min(0, "Selling price cannot be negative")
    .max(99_999_999),
  stockQuantity: z.coerce.number().int().min(0).max(9_999_999).default(0),
  minimumStockLevel: z.coerce.number().int().min(0).max(9_999_999).default(0),
  supplierId: z.string().trim().max(100).nullable().optional(),
  supplier: z.string().trim().max(255).optional(),
  status: z.enum(PRODUCT_STATUSES).default("ACTIVE"),
  image: imageSchema.nullable().optional(),
  branchId: z.string().trim().max(100).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const updateProductDto = z
  .object({
    name: z.string().trim().min(1, "Product name cannot be empty").max(255).optional(),
    sku: z
      .string()
      .trim()
      .min(1, "SKU cannot be empty")
      .max(80)
      .transform((value) => value.toUpperCase())
      .optional(),
    categoryId: z.string().trim().max(100).nullable().optional(),
    brand: z.string().trim().max(120).nullable().optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    unit: z.string().trim().min(1).max(60).optional(),
    costPrice: z.coerce.number().min(0).max(99_999_999).optional(),
    sellingPrice: z.coerce.number().min(0).max(99_999_999).optional(),
    stockQuantity: z.coerce.number().int().min(0).max(9_999_999).optional(),
    minimumStockLevel: z.coerce.number().int().min(0).max(9_999_999).optional(),
    supplierId: z.string().trim().max(100).nullable().optional(),
    supplier: z.string().trim().max(255).nullable().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    image: imageSchema.nullable().optional(),
    branchId: z.string().trim().max(100).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type ProductParamsDto = z.infer<typeof productParamsDto>;
export type ListProductsQueryDto = z.infer<typeof listProductsQueryDto>;
export type CreateProductDto = z.infer<typeof createProductDto>;
export type UpdateProductDto = z.infer<typeof updateProductDto>;
