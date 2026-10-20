import { z } from "zod";

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
  role: z.enum(["SUPER_ADMIN", "ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

export type CreateUserDto = z.infer<typeof createUserDto>;