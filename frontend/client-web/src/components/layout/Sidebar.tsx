import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/features/orders/hooks/useMyOrders";
import { brandIcon, navGroups } from "./nav-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { can } = usePermissions();
  const { user, logout } = useAuth();
  const { activeCount } = useMyOrders();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onNavigate?.();
    // Navigate immediately; `logout` clears the server session and local state
    // in the background.
    navigate("/login", { replace: true });
    void logout();
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            {(() => {
              const Icon = brandIcon;
              return <Icon className="h-4 w-4" />;
            })()}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Agrivet Admin</span>
            <span className="text-[11px] text-muted-foreground">
              Booking & Inventory
            </span>
          </div>
        </div>
      </div>
      {user && (
        <div className="px-5 py-4">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Logged in as
            </div>
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <Badge
                variant="secondary"
                className="w-fit border border-primary/20 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide leading-tight text-primary"
              >
                {ROLE_LABELS[user.role]}
              </Badge>
              <span
                className="max-w-full truncate text-[13px] font-semibold leading-tight text-foreground"
                title={user.fullName}
              >
                {user.fullName}
              </span>
            </div>
          </div>
        </div>
      )}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) =>
            can(item.permission)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="space-y-1">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                // Mirrors NavLink matching (segment aware, honours `end`) but
                // runs entirely off location so `excludePaths` can win over
                // both the highlight and aria-current.
                const isMatch = item.end
                  ? location.pathname === item.href
                  : location.pathname === item.href ||
                    location.pathname.startsWith(`${item.href}/`);
                const isExcluded = (item.excludePaths ?? []).some(
                  (path) =>
                    location.pathname === path ||
                    location.pathname.startsWith(`${path}/`)
                );
                const isCurrent = isMatch && !isExcluded;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      isCurrent
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.href === "/orders" && activeCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {activeCount}
                        </span>
                      )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="space-y-2 border-t px-3 py-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
        <div className="px-2 text-[11px] text-muted-foreground">
          v1.0.0 • {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}