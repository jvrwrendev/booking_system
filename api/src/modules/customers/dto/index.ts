import { z } from "zod";

const addressRefDto = z.object({
  code: z.string().trim().max(40).default(""),
  name: z.string().trim().min(1, "Address name is required").max(160),
});

const addressPartsDto = z.object({
  street: z.string().trim().min(1, "Street is required").max(220),
  purok: z.string().trim().min(1, "Purok is required").max(120),
  barangay: addressRefDto,
  city: addressRefDto,
  province: addressRefDto,
  region: addressRefDto,
});

const contactNumberDto = z
  .string()
  .trim()
  .min(7, "Contact number is required")
  .max(30)
  .regex(/^[0-9+()\-\s]+$/, "Enter a valid contact number");

export const customerParamsDto = z.object({
  id: z.string().min(1, "Customer id is required").max(100),
});

const customerStatusDto = z.enum(["ACTIVE", "INACTIVE"]);

export const listCustomersQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().trim().max(255).optional(),
  agentId: z.string().trim().max(100).optional(),
  status: customerStatusDto.optional(),
});

export const createCustomerDto = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(120, "Full name is too long"),
  contactNumber: contactNumberDto,
  gender: z.string().trim().max(30).optional(),
  addressParts: addressPartsDto,
  assignedAgentId: z.string().trim().max(100).optional(),
  status: customerStatusDto.optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateCustomerDto = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name cannot be empty")
      .max(120, "Full name is too long")
      .optional(),
    contactNumber: contactNumberDto.optional(),
    gender: z.string().trim().max(30).nullable().optional(),
    addressParts: addressPartsDto.optional(),
    assignedAgentId: z.string().trim().max(100).optional(),
    status: customerStatusDto.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CustomerParamsDto = z.infer<typeof customerParamsDto>;
export type ListCustomersQueryDto = z.infer<typeof listCustomersQueryDto>;
export type CreateCustomerDto = z.infer<typeof createCustomerDto>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerDto>;
export type AddressPartsDto = z.infer<typeof addressPartsDto>;
export type AddressRefDto = z.infer<typeof addressRefDto>;
