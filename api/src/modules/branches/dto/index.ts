import { z } from "zod";

const addressRefDto = z.object({
  code: z.string().trim().max(40).default(""),
  name: z.string().trim().max(160).default(""),
});

const addressPartsDto = z.object({
  street: z.string().trim().max(220).default(""),
  purok: z.string().trim().max(120).default(""),
  barangay: addressRefDto,
  city: addressRefDto,
  province: addressRefDto,
  region: addressRefDto,
});

const branchStatusDto = z.enum(["ACTIVE", "INACTIVE"]);

export const branchParamsDto = z.object({
  id: z.string().min(1, "Branch id is required").max(100),
});

export const listBranchesQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().trim().max(255).optional(),
  status: branchStatusDto.optional(),
});

export const createBranchDto = z.object({
  name: z.string().trim().min(1, "Branch name is required").max(255),
  code: z
    .string()
    .trim()
    .min(1, "Branch code is required")
    .max(50)
    .transform((value) => value.toUpperCase()),
  email: z
    .string()
    .trim()
    .email("A valid email is required")
    .max(255)
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  manager: z.string().trim().max(255).optional(),
  contactNumber: z.string().trim().max(40).optional(),
  addressParts: addressPartsDto.optional(),
  status: branchStatusDto.default("ACTIVE"),
});

export const updateBranchDto = z
  .object({
    name: z.string().trim().min(1, "Branch name cannot be empty").max(255).optional(),
    code: z
      .string()
      .trim()
      .min(1, "Branch code cannot be empty")
      .max(50)
      .transform((value) => value.toUpperCase())
      .optional(),
    email: z
      .string()
      .trim()
      .email("A valid email is required")
      .max(255)
      .toLowerCase()
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .optional(),
    manager: z.string().trim().max(255).nullable().optional(),
    contactNumber: z.string().trim().max(40).nullable().optional(),
    addressParts: addressPartsDto.nullable().optional(),
    status: branchStatusDto.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateBranchStatusDto = z.object({
  status: branchStatusDto,
});

export type BranchParamsDto = z.infer<typeof branchParamsDto>;
export type ListBranchesQueryDto = z.infer<typeof listBranchesQueryDto>;
export type CreateBranchDto = z.infer<typeof createBranchDto>;
export type UpdateBranchDto = z.infer<typeof updateBranchDto>;
export type UpdateBranchStatusDto = z.infer<typeof updateBranchStatusDto>;
export type AddressPartsDto = z.infer<typeof addressPartsDto>;
