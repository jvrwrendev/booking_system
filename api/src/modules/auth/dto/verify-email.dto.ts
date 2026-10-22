import { z } from "zod";

export const verifyEmailDto = z.object({
  email: z
    .string()
    .trim()
    .email("A valid email is required")
    .max(255)
    .toLowerCase(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "The verification code must be exactly six digits"),
});

export type VerifyEmailDto = z.infer<typeof verifyEmailDto>;
