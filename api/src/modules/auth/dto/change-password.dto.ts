import { z } from "zod";

export const changePasswordDto = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128),
});

export type ChangePasswordDto = z.infer<typeof changePasswordDto>;