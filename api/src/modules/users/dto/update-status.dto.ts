import { z } from "zod";

export const updateUserStatusDto = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusDto>;