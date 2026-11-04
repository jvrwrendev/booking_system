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

export const createUserDto = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
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
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "BRANCH"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
  contactNumber: z.string().trim().max(40).optional(),
  addressParts: addressPartsDto.optional(),
});

export type CreateUserDto = z.infer<typeof createUserDto>;
