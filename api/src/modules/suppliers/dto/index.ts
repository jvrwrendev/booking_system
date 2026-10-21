import { z } from "zod";

export const supplierParamsDto = z.object({
  id: z.string().min(1, "Supplier id is required").max(100),
});

export const listSuppliersQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortBy: z.enum(["name", "createdAt"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const createSupplierDto = z.object({
  name: z.string().trim().min(1, "Supplier name is required").max(160),
  contactName: z.string().trim().max(160).optional(),
  contactNumber: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateSupplierDto = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Supplier name cannot be empty")
      .max(160)
      .optional(),
    contactName: z.string().trim().max(160).nullable().optional(),
    contactNumber: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type SupplierParamsDto = z.infer<typeof supplierParamsDto>;
export type ListSuppliersQueryDto = z.infer<typeof listSuppliersQueryDto>;
export type CreateSupplierDto = z.infer<typeof createSupplierDto>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierDto>;
