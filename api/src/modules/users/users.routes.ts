import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
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
  createUserDto,
  listUsersQueryDto,
  setPasswordDto,
  updateUserDto,
  updateUserStatusDto,
  userParamsDto,
} from "./dto/index.js";

export const usersRouter = Router();

usersRouter.use(requireRole("ADMIN"));

usersRouter.get(
  "/",
  validateQuery(listUsersQueryDto),
  listUsersController,
);

usersRouter.get("/:id", validateParams(userParamsDto), getUserController);

usersRouter.post("/", validateBody(createUserDto), createUserController);

usersRouter.patch(
  "/:id",
  validateParams(userParamsDto),
  validateBody(updateUserDto),
  updateUserController,
);

usersRouter.patch(
  "/:id/status",
  validateParams(userParamsDto),
  validateBody(updateUserStatusDto),
  updateUserStatusController,
);

usersRouter.patch(
  "/:id/password",
  validateParams(userParamsDto),
  validateBody(setPasswordDto),
  setPasswordController,
);

usersRouter.delete(
  "/:id",
  validateParams(userParamsDto),
  deleteUserController,
);