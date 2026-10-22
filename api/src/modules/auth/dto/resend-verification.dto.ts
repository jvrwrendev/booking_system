import { z } from "zod";

export const resendVerificationDto = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email is required")
    .max(255)
    .toLowerCase(),
});

export type ResendVerificationDto = z.infer<typeof resendVerificationDto>;
