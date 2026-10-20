import { z } from "zod";

export const registerDto = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120),
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
  contactNumber: z.string().trim().max(40).optional(),
  address: z.string().trim().max(500).optional(),
  avatar: z.string().trim().url("Avatar must be a valid URL").max(500).optional(),
  role: z.enum(["AGENT", "BRANCH"], {
    errorMap: () => ({ message: "Role must be AGENT or BRANCH" }),
  }),
});

export type RegisterDto = z.infer<typeof registerDto>;
