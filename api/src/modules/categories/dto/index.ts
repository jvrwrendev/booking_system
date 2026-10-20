import { z } from "zod";

export const categoryParamsDto = z.object({
  id: z.string().min(1, "Category id is required").max(100),
});

export const listCategoriesQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortBy: z.enum(["name", "createdAt", "productCount"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createCategoryDto = z.object({
  name: z.string().trim().min(1, "Category name is required").max(120),
  description: z.string().trim().max(1000).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const updateCategoryDto = z
  .object({
    name: z.string().trim().min(1, "Category name cannot be empty").max(120).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CategoryParamsDto = z.infer<typeof categoryParamsDto>;
export type ListCategoriesQueryDto = z.infer<typeof listCategoriesQueryDto>;
export type CreateCategoryDto = z.infer<typeof createCategoryDto>;
export type UpdateCategoryDto = z.infer<typeof updateCategoryDto>;
