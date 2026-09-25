import type { PublicUser } from "../../lib/user-select.js";

export type UserView = PublicUser;

export interface ListUsersResult {
  users: UserView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}