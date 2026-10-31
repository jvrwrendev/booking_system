import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

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
  showRole: _showRole = true,
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
    </div>
  );
}
