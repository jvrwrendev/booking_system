import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useMyOrders } from "@/features/orders/hooks/useMyOrders";
import { navGroups } from "./nav-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/common/BrandLogo";
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
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <BrandLogo className="h-8 w-8" />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-semibold text-foreground">
            Agrivet Admin
          </span>
          <span className="truncate text-xs text-muted-foreground">
            Booking &amp; Inventory
          </span>
        </div>
      </div>

      <nav
        className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin"
        aria-label="Main navigation"
      >
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => can(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <h2 className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <ul className="space-y-0.5">
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
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onNavigate}
                        aria-current={isCurrent ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          isCurrent
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        {isCurrent && (
                          <span
                            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                            aria-hidden
                          />
                        )}
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )}
                          aria-hidden
                        />
                        <span className="truncate">{item.title}</span>
                        {item.href === "/orders" && activeCount > 0 && (
                          <Badge
                            variant="muted"
                            className="ml-auto shrink-0 px-1.5 py-0 text-xs tabular-nums"
                          >
                            {activeCount}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t p-3">
        {user && (
          <div className="rounded-md border bg-muted/40 px-3 py-2.5">
            <div className="truncate text-sm font-medium text-foreground">
              {user.fullName}
            </div>
            <Badge
              variant="secondary"
              className="mt-1 border border-primary/20 bg-primary/10 px-1.5 py-0 text-xs font-medium text-primary"
            >
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
        <div className="px-1 text-xs text-muted-foreground">
          v1.0.0 • {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
}
