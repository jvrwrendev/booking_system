import { z } from "zod";

export const idParamSchema = z.object({
  id: z.string().min(1, "User id is required").max(100),
});

export const createUserSchema = z.object({
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

export const updateUserSchema = z
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

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;