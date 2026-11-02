import { z } from "zod";

const addressRefDto = z.object({
  code: z.string().trim().max(40).default(""),
  name: z.string().trim().max(160).default(""),
});

const addressPartsDto = z.object({
  street: z.string().trim().max(220).default(""),
  barangay: addressRefDto,
  city: addressRefDto,
  province: addressRefDto,
  region: addressRefDto,
});

export const updateUserDto = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(255).optional(),
    email: z
      .string()
      .trim()
      .email("A valid email is required")
      .max(255)
      .toLowerCase()
      .optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "BRANCH"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    contactNumber: z.string().trim().max(40).nullable().optional(),
    addressParts: addressPartsDto.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateUserDto = z.infer<typeof updateUserDto>;
