import { Link } from "react-router-dom";
import { BellOff, CheckCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import type { NotificationVariant } from "@/features/notifications/types";
import { cn, relativeTime } from "@/lib/utils";

const chipLabels: Record<NotificationVariant, string> = {
  destructive: "Out",
  warning: "Low",
  info: "New",
};

export function NotificationsCard() {
  const { notifications, unreadCount, loading, markRead, markAllRead } =
    useNotifications();

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="px-1.5 py-0 text-xs tabular-nums">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Stock and booking alerts that need attention.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="h-8" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            Mark read
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        {loading ? (
          <div className="space-y-3 py-3" aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-12 rounded-md" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<BellOff className="h-5 w-5" aria-hidden />}
            title="You're all caught up"
            description="No low stock items or pending bookings."
            className="border-0 py-10"
          />
        ) : (
          <ul className="max-h-[240px] divide-y overflow-y-auto scrollbar-thin">
            {notifications.map((n) => (
              <li key={n.id} className="py-2.5">
                <Link
                  to={n.href}
                  onClick={() => markRead(n.id)}
                  className="flex items-start gap-2.5 rounded-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Badge
                    variant={n.variant}
                    className="mt-0.5 shrink-0 px-1.5 py-0 text-xs"
                  >
                    {chipLabels[n.variant]}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-sm",
                        n.read ? "text-muted-foreground" : "font-medium text-foreground"
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {n.description}
                    </span>
                  </span>
                  <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
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
