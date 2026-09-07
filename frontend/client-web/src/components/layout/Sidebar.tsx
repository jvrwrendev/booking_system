import { useMemo } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { brandIcon, navGroups } from "./nav-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onNavigate?: () => void;
}

const ACTIVE_BOOKING_STATUSES = ["assigned", "confirmed", "processing", "ready"];

export function Sidebar({ onNavigate }: SidebarProps) {
  const { can } = usePermissions();
  const { user, logout } = useAuth();
  const { bookings } = useBookingsStore();
  const navigate = useNavigate();

  const assignedCount = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.assignedAdminId === user?.id &&
          ACTIVE_BOOKING_STATUSES.includes(b.status)
      ).length,
    [bookings, user?.id]
  );

  const handleLogout = () => {
    onNavigate?.();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r bg-card">
      <div className="flex h-14 items-center gap-2 border-b px-5">
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
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.title}</span>
                    {item.href === "/my-assigned-bookings" &&
                      assignedCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {assignedCount}
                        </span>
                      )}
                  </NavLink>
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