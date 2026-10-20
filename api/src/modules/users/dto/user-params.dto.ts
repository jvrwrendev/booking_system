import { z } from "zod";

export const userParamsDto = z.object({
  id: z.string().min(1, "User id is required").max(100),
});

export type UserParamsDto = z.infer<typeof userParamsDto>;