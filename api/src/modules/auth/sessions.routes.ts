import { Router } from "express";
import {
  listSessionsController,
  revokeAllSessionsController,
  revokeSessionController,
} from "./auth.controller.js";

export const sessionsRouter = Router();

sessionsRouter.get("/", listSessionsController);

sessionsRouter.delete("/", revokeAllSessionsController);

sessionsRouter.delete("/:id", revokeSessionController);