import { z } from "zod";

export const updateProfileDto = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120).optional(),
    email: z
      .string()
      .trim()
      .email("A valid email is required")
      .max(255)
      .toLowerCase()
      .optional(),
    contactNumber: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(500).nullable().optional(),
    avatar: z
      .string()
      .trim()
      .url("Avatar must be a valid URL")
      .max(500)
      .nullable()
      .optional(),
  })
  .refine(
    (dto) =>
      dto.name !== undefined ||
      dto.email !== undefined ||
      dto.contactNumber !== undefined ||
      dto.address !== undefined ||
      dto.avatar !== undefined,
    { message: "At least one field is required" },
  );

export type UpdateProfileDto = z.infer<typeof updateProfileDto>;
