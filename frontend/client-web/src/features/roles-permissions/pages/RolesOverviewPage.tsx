import { Link } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
  Users as UsersIcon,
  LayoutDashboard,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  ALL_PERMISSIONS,
  ALL_ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type Role,
} from "@/lib/permissions";
import { mockUsers } from "@/data/mock-users";
import { useRolesPermissionsStore } from "../hooks/useRolesPermissionsStore";

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  SUPER_ADMIN: ShieldCheck,
  ADMIN: UsersIcon,
};

function roleMemberCount(role: Role): number {
  return mockUsers.filter((u) => u.role === role).length;
}

export function RolesOverviewPage() {
  const { getRolePermissions } = useRolesPermissionsStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="View system roles and manage the permissions granted to each role."
        breadcrumbs={[{ label: "Administration" }, { label: "Roles & Permissions" }]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{ALL_ROLES.length} roles</Badge>
            <Badge variant="secondary">{ALL_PERMISSIONS.length} permissions</Badge>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {ALL_ROLES.map((role) => {
          const Icon = ROLE_ICONS[role];
          const permissions = getRolePermissions(role);
          const members = roleMemberCount(role);
          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {ROLE_LABELS[role]}
                    </CardTitle>
                    <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{members} member(s)</Badge>
                  <Badge variant="secondary">
                    {permissions.length} permission(s)
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {permissions.length === 0
                      ? "No access granted"
                      : `Access to ${permissions.length} of ${ALL_PERMISSIONS.length} permissions`}
                  </span>
                  <Button asChild size="sm">
                    <Link to={`/roles/${role}`}>
                      <KeyRound className="h-4 w-4" />
                      Manage
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Permissions are stored in mock frontend state and control which
          modules and actions each role can access. Granting or revoking a
          permission takes effect immediately for the logged-in user when they
          reload or navigate the app.
        </CardContent>
      </Card>
    </div>
  );
}