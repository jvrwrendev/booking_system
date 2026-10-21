import { Bell, LogOut, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { cn, initials, relativeTime } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    navigate("/login", { replace: true });
    void logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </Button>

      <div className="hidden flex-1 md:flex">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <Bell className="h-5 w-5" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Mark all read
                </button>
              )}
            </div>
            <DropdownMenuSeparator className="my-0" />
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onSelect={() => {
                      markRead(n.id);
                      navigate(n.href);
                    }}
                    className="items-start rounded-none px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                        n.read ? "bg-muted-foreground/30" : "bg-primary"
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm",
                          n.read ? "text-muted-foreground" : "font-medium"
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {relativeTime(n.timestamp)}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2" aria-label="Account menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown
                className="hidden h-4 w-4 text-muted-foreground md:block"
                aria-hidden
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                {user.fullName}
              </span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate("/audit-logs")}>
              Activity log
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
