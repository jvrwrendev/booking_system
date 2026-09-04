import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Mail, MoreHorizontal, Pencil, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import type { AuthUser } from "@/types/auth";
import { useUsersStore } from "../hooks/useUsersStore";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatDate, initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function UsersListPage() {
  const { user: currentUser } = useAuth();
  const { users, toggleStatus } = useUsersStore();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [resetTarget, setResetTarget] = useState<AuthUser | null>(null);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (roleFilter !== "all" && u.role !== roleFilter) return false;
        if (statusFilter !== "all" && u.status !== statusFilter) return false;
        return true;
      }),
    [users, roleFilter, statusFilter]
  );

  const handleToggle = (user: AuthUser) => {
    if (user.role === "SUPER_ADMIN" && user.id === currentUser?.id) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    toggleStatus(user.id, user.status === "active" ? "inactive" : "active");
  };

  const columns: DataTableColumn<AuthUser>[] = [
    {
      id: "name",
      header: "User",
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(u.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium">{u.fullName}</div>
            <div className="text-xs text-muted-foreground">@{u.username}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "fullName",
    },
    {
      id: "email",
      header: "Email",
      cell: (u) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          {u.email}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "role",
      header: "Role",
      cell: (u) => (
        <Badge variant={u.role === "SUPER_ADMIN" ? "default" : "secondary"}>
          <ShieldCheck className="mr-1 h-3 w-3" />
          {ROLE_LABELS[u.role]}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (u) => (
        <Badge variant={u.status === "active" ? "success" : "muted"}>
          {u.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "lastLogin",
      header: "Last Login",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {u.lastLogin ? formatDate(u.lastLogin) : "Never"}
        </span>
      ),
      sortable: true,
      sortKey: "lastLogin",
      className: "hidden md:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/users/${u.id}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setResetTarget(u)}>
              <KeyRound className="h-4 w-4" />
              Reset password
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleToggle(u)}>
              {u.status === "active" ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage system administrators and their roles."
        breadcrumbs={[{ label: "Administration" }, { label: "Users" }]}
        actions={
          <Button asChild>
            <Link to="/users/add">
              <Plus className="h-4 w-4" />
              Add Admin
            </Link>
          </Button>
        }
      />

      <DataTable<AuthUser>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search users..."
        searchKeys={["fullName", "email", "username"]}
        rowKey={(u) => u.id}
        toolbar={
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(o) => !o && setResetTarget(null)}
        title="Reset password"
        description="A reset link would be emailed to the user. (Mock action — connect a backend to enable.)"
        confirmText="Send reset link"
        onConfirm={() => {
          toast.success("Password reset email sent (mock)", {
            description: `${resetTarget?.email} will receive reset instructions.`,
          });
          setResetTarget(null);
        }}
      />
    </div>
  );
}
