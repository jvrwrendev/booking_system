import { z } from "zod";

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
    role: z.enum(["SUPER_ADMIN", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateUserDto = z.infer<typeof updateUserDto>;