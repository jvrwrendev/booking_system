import { z } from "zod";

export const BRANCH_ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "ASSIGNED",
  "ADMIN_ACCEPTED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "READY_FOR_DELIVERY",
  "REJECTED",
] as const;

export const branchOrderParamsDto = z.object({
  id: z.string().trim().min(1, "Branch order id is required").max(100),
});

const branchOrderFilterShape = {
  search: z.string().trim().max(255).optional(),
  status: z.enum(BRANCH_ORDER_STATUSES).optional(),
  branchId: z.string().trim().max(100).optional(),
  assignedAdminId: z.string().trim().max(100).optional(),
  assignment: z.enum(["assigned", "unassigned"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

export const branchOrderFiltersDto = z.object(branchOrderFilterShape);

export const listBranchOrdersQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  ...branchOrderFilterShape,
  sortBy: z
    .enum([
      "reference",
      "branchName",
      "orderDate",
      "totalAmount",
      "status",
      "createdAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const branchOrderItemDto = z.object({
  productId: z.string().trim().min(1, "Product is required").max(100),
  quantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be greater than zero")
    .max(9_999_999),
});

export const createBranchOrderDto = z.object({
  branchId: z.string().trim().max(100).optional(),
  orderDate: z.coerce.date().optional(),
  items: z
    .array(branchOrderItemDto)
    .min(1, "At least one item is required"),
  discount: z.coerce.number().min(0).max(99_999_999).default(0),
  notes: z.string().trim().max(2000).optional(),
});

export const updateBranchOrderDto = z
  .object({
    branchId: z.string().trim().min(1).max(100).optional(),
    orderDate: z.coerce.date().optional(),
    items: z.array(branchOrderItemDto).min(1).optional(),
    discount: z.coerce.number().min(0).max(99_999_999).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateBranchOrderStatusDto = z.object({
  status: z.enum(BRANCH_ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const assignBranchOrderDto = z.object({
  adminId: z.string().trim().min(1, "Admin is required").max(100),
  note: z.string().trim().max(500).optional(),
});

export const applyBranchOrderDiscountDto = z.object({
  discount: z.coerce.number().min(0).max(99_999_999),
  note: z.string().trim().max(500).optional(),
});

export type BranchOrderParamsDto = z.infer<typeof branchOrderParamsDto>;
export type BranchOrderFiltersDto = z.infer<typeof branchOrderFiltersDto>;
export type ListBranchOrdersQueryDto = z.infer<
  typeof listBranchOrdersQueryDto
>;
export type CreateBranchOrderDto = z.infer<typeof createBranchOrderDto>;
export type UpdateBranchOrderDto = z.infer<typeof updateBranchOrderDto>;
export type UpdateBranchOrderStatusDto = z.infer<
  typeof updateBranchOrderStatusDto
>;
export type AssignBranchOrderDto = z.infer<typeof assignBranchOrderDto>;
export type ApplyBranchOrderDiscountDto = z.infer<
  typeof applyBranchOrderDiscountDto
>;
