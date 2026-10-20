import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";
import { useDebounce } from "@/hooks/usePermissions";
import type { AccountStatus, AuthUser } from "@/types/auth";
import {
  createUser as createUserRequest,
  deleteUser as deleteUserRequest,
  listUsers,
  setUserPassword as setUserPasswordRequest,
  setUserStatus as setUserStatusRequest,
  updateUser as updateUserRequest,
} from "../services/users.service";
import {
  toAuthUser,
  toCreateUserPayload,
  toUpdateUserPayload,
  type UserFormValues,
} from "../lib/user-mapper";

/**
 * Server-backed admin user management.
 *
 * The API owns pagination, search, and filtering, so this store holds the
 * query state and the current page of results rather than the full user list.
 * Mutations refetch so totals stay accurate after a delete or a filter change.
 */

export interface UserFilters {
  search: string;
  /** "all" or a Role. */
  role: string;
  /** "all" or an AccountStatus. */
  status: string;
}

interface UsersContextValue {
  users: AuthUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  filters: UserFilters;
  setSearch: (value: string) => void;
  setRoleFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  refresh: () => Promise<void>;
  addUser: (values: UserFormValues) => Promise<AuthUser>;
  editUser: (id: string, values: UserFormValues) => Promise<AuthUser>;
  setStatus: (id: string, status: AccountStatus) => Promise<void>;
  setPassword: (id: string, password: string) => Promise<void>;
  removeUser: (id: string, name: string) => Promise<void>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

const INITIAL_FILTERS: UserFilters = { search: "", role: "all", status: "all" };

function messageFor(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  return fallback;
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>(INITIAL_FILTERS);

  // Typing should stay responsive; only a settled query reaches the API.
  const debouncedSearch = useDebounce(filters.search, 300);

  const load = useCallback(
    async (nextPage: number, overridePageSize?: number) => {
      const size = overridePageSize ?? pageSize;
      setLoading(true);
      setError(null);
      try {
        const result = await listUsers({
          page: nextPage,
          pageSize: size,
          search: debouncedSearch || undefined,
          role: filters.role,
          status: filters.status,
        });
        setUsers(result.users.map(toAuthUser));
        setTotal(result.total);
        setPage(result.page);
        setPageSize(result.pageSize);
        setTotalPages(result.totalPages);
      } catch (err) {
        setError(messageFor(err, "Could not load users."));
        setUsers([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, debouncedSearch, filters.role, filters.status]
  );

  // Reload whenever the query changes. Filter setters already reset to page 1,
  // so a narrowed result set never strands the user on an empty page.
  useEffect(() => {
    void load(page, pageSize);
  }, [debouncedSearch, filters.role, filters.status, page, pageSize]);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPage(1);
  }, []);

  const setRoleFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, role: value }));
    setPage(1);
  }, []);

  const setStatusFilter = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
    setPage(1);
  }, []);

  // A larger page size can leave the current page number out of range, so
  // page size changes always return to the first page.
  const changePageSize = useCallback((value: number) => {
    setPageSize(value);
    setPage(1);
  }, []);

  const refresh = useCallback(() => load(page, pageSize), [load, page, pageSize]);

  const addUser = useCallback(
    async (values: UserFormValues) => {
      if (!values.password) {
        throw new ApiError(400, "VALIDATION_ERROR", "A password is required.");
      }
      try {
        const created = await createUserRequest(
          toCreateUserPayload({ ...values, password: values.password })
        );
        toast.success("Admin user created", {
          description: `${created.fullName} has been added.`,
        });
        // Jump to page 1 so the new record is visible.
        if (page !== 1) {
          setPage(1);
        } else {
          await load(1, pageSize);
        }
        return created;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          messageFor(err, "Could not create the account.")
        );
      }
    },
    [page, pageSize, load]
  );

  const editUser = useCallback(
    async (id: string, values: UserFormValues) => {
      try {
        const updated = await updateUserRequest(id, toUpdateUserPayload(values));
        toast.success("User updated", {
          description: `${updated.fullName} has been saved.`,
        });
        await load(page, pageSize);
        return updated;
      } catch (err) {
        throw new ApiError(
          err instanceof ApiError ? err.status : 500,
          err instanceof ApiError ? err.code : "UNKNOWN",
          messageFor(err, "Could not save the changes.")
        );
      }
    },
    [page, pageSize, load]
  );

  const setStatus = useCallback(
    async (id: string, status: AccountStatus) => {
      try {
        const updated = await setUserStatusRequest(id, status);
        toast.success("User status updated", {
          description: `${updated.fullName} is now ${status}.`,
        });
        await load(page, pageSize);
      } catch (err) {
        toast.error("Could not update status", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [page, pageSize, load]
  );

  const setPassword = useCallback(
    async (id: string, password: string) => {
      try {
        await setUserPasswordRequest(id, password);
        toast.success("Password updated", {
          description: "Share the new password with the user securely.",
        });
      } catch (err) {
        toast.error("Could not set password", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    []
  );

  const removeUser = useCallback(
    async (id: string, name: string) => {
      try {
        await deleteUserRequest(id);
        toast.success("User deleted", { description: `${name} was removed.` });
        // The deleted row may have been the last one on this page.
        const remainingOnPage = users.length - 1;
        const nextPage = remainingOnPage === 0 && page > 1 ? page - 1 : page;
        await load(nextPage, pageSize);
      } catch (err) {
        toast.error("Could not delete user", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [users.length, page, pageSize, load]
  );

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      setSearch,
      setRoleFilter,
      setStatusFilter,
      setPage,
      setPageSize: changePageSize,
      refresh,
      addUser,
      editUser,
      setStatus,
      setPassword,
      removeUser,
    }),
    [
      users,
      total,
      page,
      pageSize,
      totalPages,
      loading,
      error,
      filters,
      setSearch,
      setRoleFilter,
      setStatusFilter,
      refresh,
      addUser,
      editUser,
      setStatus,
      setPassword,
      removeUser,
      changePageSize,
    ]
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsersStore(): UsersContextValue {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersStore must be used within UsersProvider");
  return ctx;
}
