import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validate.middleware.js";
import {
  createUserController,
  deleteUserController,
  getUserController,
  listUsersController,
  setPasswordController,
  updateUserController,
  updateUserStatusController,
} from "./users.controller.js";
import {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  setPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "./users.schema.js";

export const usersRouter = Router();

usersRouter.use(requireRole("ADMIN"));

usersRouter.get(
  "/",
  validateQuery(listUsersQuerySchema),
  listUsersController,
);

usersRouter.get("/:id", validateParams(idParamSchema), getUserController);

usersRouter.post("/", validateBody(createUserSchema), createUserController);

usersRouter.patch(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  updateUserController,
);

usersRouter.patch(
  "/:id/status",
  validateParams(idParamSchema),
  validateBody(updateUserStatusSchema),
  updateUserStatusController,
);

usersRouter.patch(
  "/:id/password",
  validateParams(idParamSchema),
  validateBody(setPasswordSchema),
  setPasswordController,
);

usersRouter.delete(
  "/:id",
  validateParams(idParamSchema),
  deleteUserController,
);