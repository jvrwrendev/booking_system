import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  mockUsers,
  registerAccount,
  updateAccount,
} from "@/data/mock-users";
import type { AuthUser } from "@/types/auth";

export interface UserFormValues {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  username: string;
  role: AuthUser["role"];
  status: AuthUser["status"];
  password?: string;
}

export function composeFullName(
  firstName: string,
  middleName: string,
  lastName: string,
  suffix: string
): string {
  return [firstName, middleName, lastName, suffix]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

interface UsersContextValue {
  users: AuthUser[];
  addUser: (data: UserFormValues) => AuthUser;
  updateUser: (id: string, data: UserFormValues) => void;
  toggleStatus: (id: string, status: AuthUser["status"]) => void;
  getUser: (id: string) => AuthUser | undefined;
}

const UsersContext = createContext<UsersContextValue | null>(null);

function nextId(existing: AuthUser[]): string {
  const max = existing
    .map((u) => Number(u.id.replace("USR-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `USR-${String(max + 1).padStart(3, "0")}`;
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AuthUser[]>(mockUsers);

  const value = useMemo<UsersContextValue>(
    () => ({
      users,
      addUser: (data) => {
        const user: AuthUser = {
          id: nextId(users),
          fullName: composeFullName(
            data.firstName,
            data.middleName,
            data.lastName,
            data.suffix
          ),
          email: data.email,
          username: data.username,
          role: data.role,
          status: data.status,
          createdAt: new Date().toISOString(),
        };
        registerAccount(user, data.password ?? "");
        setUsers((prev) => [user, ...prev]);
        toast.success("Admin user created", {
          description: `${user.fullName} has been added.`,
        });
        return user;
      },
      updateUser: (id, data) => {
        const fullName = composeFullName(
          data.firstName,
          data.middleName,
          data.lastName,
          data.suffix
        );
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  fullName,
                  email: data.email,
                  username: data.username,
                  role: data.role,
                  status: data.status,
                }
              : u
          )
        );
        updateAccount(id, {
          fullName,
          email: data.email,
          username: data.username,
          role: data.role,
          status: data.status,
        });
        toast.success("User updated");
      },
      toggleStatus: (id, status) => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status } : u))
        );
        updateAccount(id, { status });
        toast.success("User status updated");
      },
      getUser: (id) => users.find((u) => u.id === id),
    }),
    [users]
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsersStore() {
  const ctx = useContext(UsersContext);
  if (!ctx) throw new Error("useUsersStore must be used within UsersProvider");
  return ctx;
}
