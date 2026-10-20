import { z } from "zod";

export const loginDto = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email is required")
    .max(255)
    .toLowerCase(),
  password: z.string().min(1, "Password is required").max(128),
});

export type LoginDto = z.infer<typeof loginDto>;