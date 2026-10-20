import { z } from "zod";

export const setPasswordDto = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type SetPasswordDto = z.infer<typeof setPasswordDto>;