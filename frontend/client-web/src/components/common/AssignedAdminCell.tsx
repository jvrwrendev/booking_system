import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { mockUsers } from "@/data/mock-users";

interface AssignedAdminCellProps {
  adminId?: string | null;
  adminName?: string | null;
  /** Render the "Super Admin" role chip next to the name. */
  showRole?: boolean;
  /** Stacked layout for narrow table columns. */
  stacked?: boolean;
  className?: string;
}

/**
 * The "assigned admin" cell shared by the booking, order and tracking
 * tables, so the same person always renders the same way.
 */
export function AssignedAdminCell({
  adminId,
  adminName,
  showRole = true,
  stacked = false,
  className,
}: AssignedAdminCellProps) {
  if (!adminId && !adminName) {
    return (
      <Badge variant="muted" className="text-xs">
        Unassigned
      </Badge>
    );
  }

  const role = adminId
    ? mockUsers.find((u) => u.id === adminId)?.role
    : undefined;
  const isSuperAdmin = role === "SUPER_ADMIN";

  if (stacked) {
    return (
      <div className={className}>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-[10px]">
              {initials(adminName ?? "")}
            </AvatarFallback>
          </Avatar>
          <p className="truncate text-sm font-medium text-foreground">
            {adminName}
          </p>
        </div>
        {showRole && isSuperAdmin && (
          <Badge variant="secondary" className="mt-1 text-xs">
            Super Admin
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px]">
            {initials(adminName ?? "")}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium text-foreground">
          {adminName}
        </span>
      </div>
      {showRole && isSuperAdmin && (
        <Badge variant="outline" className="mt-1 text-xs">
          Super Admin
        </Badge>
      )}
    </div>
  );
}
