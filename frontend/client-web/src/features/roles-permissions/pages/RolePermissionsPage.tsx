import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotFound } from "@/components/common/NotFound";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import {
  ALL_PERMISSIONS,
  ALL_ROLES,
  ROLE_LABELS,
  type Permission,
  type Role,
} from "@/lib/permissions";
import { humanize } from "@/lib/status";
import { mockUsers } from "@/data/mock-users";
import { ACCESS_MODULES } from "../data/access-modules";
import { useRolesPermissionsStore } from "../hooks/useRolesPermissionsStore";

export function RolePermissionsPage() {
  const { roleId } = useParams<{ roleId: string }>();
  const { getRolePermissions, grant, revoke, setModule, resetRole } =
    useRolesPermissionsStore();
  const [resetOpen, setResetOpen] = useState(false);

  const role: Role | null = useMemo(() => {
    if (!roleId) return null;
    return ALL_ROLES.includes(roleId as Role) ? (roleId as Role) : null;
  }, [roleId]);

  if (!role) {
    return (
      <NotFound
        title="Role not found"
        message="The role you are looking for does not exist."
        backHref="/roles"
        backLabel="Back to roles"
      />
    );
  }

  const permissions = getRolePermissions(role);
  const members = mockUsers.filter((u) => u.role === role).length;
  const isSuperAdmin = role === "SUPER_ADMIN";

  const moduleFullyGranted = (modulePermissions: Permission[]) =>
    modulePermissions.every((p) => permissions.includes(p));

  const modulePartiallyGranted = (modulePermissions: Permission[]) =>
    modulePermissions.some((p) => permissions.includes(p)) &&
    !moduleFullyGranted(modulePermissions);

  const toggleModule = (
    moduleKey: string,
    modulePermissions: Permission[],
    enabled: boolean
  ) => {
    if (isSuperAdmin && moduleKey === "role-management") {
      toast.error("You cannot remove your own access to Roles & Permissions.");
      return;
    }
    setModule(role, modulePermissions, enabled);
    toast.success(
      `${enabled ? "Granted" : "Revoked"} ${ROLE_LABELS[role]} access to ${
        ACCESS_MODULES.find((m) => m.key === moduleKey)?.label
      }`
    );
  };

  const togglePermission = (permission: Permission, enabled: boolean) => {
    if (
      isSuperAdmin &&
      (permission === "roles.view" || permission === "roles.manage")
    ) {
      toast.error("You cannot remove your own access to Roles & Permissions.");
      return;
    }
    if (enabled) {
      grant(role, permission);
      toast.success(`Granted ${humanize(permission)} to ${ROLE_LABELS[role]}`);
    } else {
      revoke(role, permission);
      toast.success(`Revoked ${humanize(permission)} from ${ROLE_LABELS[role]}`);
    }
  };

  const handleReset = () => {
    resetRole(role);
    toast.success(`Restored default permissions for ${ROLE_LABELS[role]}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${ROLE_LABELS[role]} Role`}
        description="Grant or revoke module and permission access for this role."
        breadcrumbs={[
          { label: "Administration", href: "/roles" },
          { label: "Roles & Permissions", href: "/roles" },
          { label: ROLE_LABELS[role] },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/roles">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Roles
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset to defaults
            </Button>
          </div>
        }
      />

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset to default permissions?"
        description={`Every custom permission for the ${ROLE_LABELS[role]} role will be replaced with the defaults. This cannot be undone.`}
        confirmText="Reset permissions"
        destructive
        onConfirm={() => {
          handleReset();
          setResetOpen(false);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{members} member(s)</Badge>
        <Badge variant="secondary">
          {permissions.length} of {ALL_PERMISSIONS.length} permissions granted
        </Badge>
        {isSuperAdmin && (
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" />
            Protected role
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Access Modules</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {ACCESS_MODULES.map((module) => {
            const Icon = module.icon;
            const granted = moduleFullyGranted(module.permissions);
            const partial = modulePartiallyGranted(module.permissions);
            const locked =
              isSuperAdmin && module.key === "role-management";
            const grantedCount = module.permissions.filter((p) =>
              permissions.includes(p)
            ).length;
            return (
              <div
                key={module.key}
                className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      granted
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                      {module.label}
                      {locked && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Cannot revoke access to Roles &amp; Permissions.
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </p>
                    <p className="mt-0.5 max-w-lg text-xs text-muted-foreground">
                      {module.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {grantedCount}/{module.permissions.length} underlying
                      permissions
                      {partial && " — partially granted"}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`module-${module.key}`}
                  checked={granted}
                  disabled={locked}
                  onCheckedChange={(checked) =>
                    toggleModule(module.key, module.permissions, checked)
                  }
                  aria-label={`${module.label} module`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            All Permissions
          </CardTitle>
          <Badge variant="outline">{permissions.length} granted</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 sm:grid-cols-2">
            {ALL_PERMISSIONS.map((permission) => {
              const granted = permissions.includes(permission);
              const locked =
                isSuperAdmin &&
                (permission === "roles.view" ||
                  permission === "roles.manage");
              return (
                <div
                  key={permission}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2 text-sm">
                    {humanize(permission)}
                    {locked && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Cannot remove your own access to Roles &amp;
                          Permissions.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                  <Switch
                    id={`permission-${permission}`}
                    checked={granted}
                    disabled={locked}
                    onCheckedChange={(checked) =>
                      togglePermission(permission, checked)
                    }
                    aria-label={humanize(permission)}
                  />
                </div>
              );
            })}
          </div>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">
            These changes are stored in mock frontend state and persist across
            sessions. Permission changes take effect immediately — modules,
            links, and actions are hidden when the acting role lacks access.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}