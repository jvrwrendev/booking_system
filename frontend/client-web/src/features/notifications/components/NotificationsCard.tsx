import { Link } from "react-router-dom";
import { BellOff, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import type { NotificationVariant } from "@/features/notifications/types";
import { cn, relativeTime } from "@/lib/utils";

const chipLabels: Record<NotificationVariant, string> = {
  destructive: "Out",
  warning: "Low",
  info: "New",
};

export function NotificationsCard() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="px-1.5 py-0 text-[10px]">{unreadCount} new</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Stock and booking alerts that need attention.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark read
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-10 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-xs text-muted-foreground">
              No low stock items or pending bookings.
            </p>
          </div>
        ) : (
          <ul className="max-h-[240px] divide-y overflow-y-auto scrollbar-thin">
            {notifications.map((n) => (
              <li key={n.id} className="py-2.5">
                <Link
                  to={n.href}
                  onClick={() => markRead(n.id)}
                  className="flex items-start gap-2.5 rounded-md transition-colors hover:bg-accent/50"
                >
                  <Badge
                    variant={n.variant}
                    className="mt-0.5 shrink-0 px-1.5 py-0 text-[10px]"
                  >
                    {chipLabels[n.variant]}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-xs",
                        n.read ? "text-muted-foreground" : "font-medium"
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {n.description}
                    </span>
                  </span>
                  <span className="shrink-0 pt-0.5 text-[10px] text-muted-foreground">
                    {relativeTime(n.timestamp)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
