import { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, Mail, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AuthUser } from "@/types/auth";
import { useUsersStore } from "../hooks/useUsersStore";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatStatus } from "../lib/user-mapper";
import { initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const MIN_PASSWORD_LENGTH = 8;

export function UsersListPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    setSearch,
    setRoleFilter,
    setStatusFilter,
    setPage,
    setPageSize,
    setStatus,
    setPassword,
    removeUser,
  } = useUsersStore();

  const [passwordTarget, setPasswordTarget] = useState<AuthUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);

  const handleToggle = async (user: AuthUser) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot change your own account status");
      return;
    }
    await setStatus(user.id, user.status === "active" ? "inactive" : "active").catch(
      () => {}
    );
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
            <div className="text-xs text-muted-foreground">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      header: "Contact",
      cell: (u) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          {u.email}
        </div>
      ),
      className: "hidden lg:table-cell",
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
        <Badge
          variant={
            u.status === "active"
              ? "success"
              : u.status === "suspended"
                ? "destructive"
                : "muted"
          }
        >
          {formatStatus(u.status)}
        </Badge>
      ),
    },
    {
      id: "created",
      header: "Created",
      cell: (u) => (
        <span className="text-xs text-muted-foreground">
          {new Date(u.createdAt).toLocaleDateString()}
        </span>
      ),
      className: "hidden lg:table-cell",
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
            <DropdownMenuItem onSelect={() => setPasswordTarget(u)}>
              <KeyRound className="h-4 w-4" />
              Set password
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleToggle(u)}
              disabled={u.id === currentUser?.id}
            >
              {u.status === "active" ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setDeleteTarget(u)}
              disabled={u.id === currentUser?.id}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
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

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <DataTable<AuthUser>
        data={users}
        columns={columns}
        loading={loading}
        searchPlaceholder="Search by name or email..."
        rowKey={(u) => u.id}
        emptyState={
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium">
              {filters.search || filters.role !== "all" || filters.status !== "all"
                ? "No users match your filters"
                : "No users yet"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {filters.search || filters.role !== "all" || filters.status !== "all"
                ? "Try a different search term or clear the filters."
                : "Add the first admin account to get started."}
            </p>
          </div>
        }
        serverMode={{
          search: filters.search,
          onSearchChange: setSearch,
          page,
          pageSize,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        toolbar={
          <>
            <Select value={filters.role} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      <SetPasswordDialog
        user={passwordTarget}
        onOpenChange={(open) => !open && setPasswordTarget(null)}
        onSubmit={async (password) => {
          if (!passwordTarget) return;
          await setPassword(passwordTarget.id, password);
          setPasswordTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete user"
        description={
          deleteTarget
            ? `${deleteTarget.fullName} (${deleteTarget.email}) will be permanently removed and signed out everywhere. This cannot be undone.`
            : ""
        }
        confirmText="Delete user"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          const name = deleteTarget.fullName;
          const id = deleteTarget.id;
          setDeleteTarget(null);
          await removeUser(id, name).catch(() => {});
        }}
      />
    </div>
  );
}

interface SetPasswordDialogProps {
  user: AuthUser | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => Promise<void>;
}

function SetPasswordDialog({ user, onOpenChange, onSubmit }: SetPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset the form each time a different user is opened.
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  if (user && user.id !== lastUserId) {
    setLastUserId(user.id);
    setPassword("");
    setConfirm("");
    setError(null);
  }

  const handleConfirm = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(password);
      setLastUserId(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set password</DialogTitle>
          <DialogDescription>
            Set a new password for {user?.fullName}. Their existing sessions stay
            active, so ask them to sign out and back in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-new-password">Confirm password</Label>
            <Input
              id="confirm-new-password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="h-10"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving} className="min-w-[130px]">
            {saving ? "Saving..." : "Set password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
