import { z } from "zod";

export const sessionParamsDto = z.object({
  id: z.string().min(1, "Session id is required").max(100),
});

export type SessionParamsDto = z.infer<typeof sessionParamsDto>;