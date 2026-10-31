import { z } from "zod";

export const listUsersQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(255).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "AGENT", "BRANCH"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export type ListUsersQueryDto = z.infer<typeof listUsersQueryDto>;