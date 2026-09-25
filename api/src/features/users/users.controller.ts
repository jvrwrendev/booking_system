import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as usersService from "./users.service.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  SetPasswordInput,
  UpdateUserInput,
  UpdateUserStatusInput,
} from "./users.schema.js";

type UsersRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listUsersController = asyncHandler(
  async (req: UsersRequest, res) => {
    const query = req.query as unknown as ListUsersQuery;
    const result = await usersService.listUsers(query);
    return sendSuccess(res, result);
  },
);

export const getUserController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const user = await usersService.getUserById(req.params.id);
    return sendSuccess(res, { user });
  },
);

export const createUserController = asyncHandler(
  async (req: UsersRequest<CreateUserInput>, res) => {
    const user = await usersService.createUser(req.user, req.body);
    return sendSuccess(res, { user }, 201);
  },
);

export const updateUserController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateUserInput>, res) => {
    const user = await usersService.updateUser(req.user, req.params.id, req.body);
    return sendSuccess(res, { user });
  },
);

export const updateUserStatusController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateUserStatusInput>,
    res,
  ) => {
    const user = await usersService.updateUserStatus(
      req.user,
      req.params.id,
      req.body,
    );
    return sendSuccess(res, { user });
  },
);

export const setPasswordController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }, unknown, SetPasswordInput>, res) => {
    await usersService.setUserPassword(req.user, req.params.id, req.body);
    return sendSuccess(res, { message: "Password updated successfully" });
  },
);

export const deleteUserController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await usersService.deleteUser(req.user, req.params.id);
    return sendSuccess(res, { message: "User deleted successfully" });
  },
);