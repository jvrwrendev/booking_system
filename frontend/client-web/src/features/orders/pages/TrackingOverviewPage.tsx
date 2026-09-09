import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Radio,
  UserRound,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import {
  StatusBadge,
  getBookingStatusVariant,
  getBranchOrderStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { mockUsers } from "@/data/mock-users";
import { initials, relativeTime } from "@/lib/utils";
import { ORDER_JOURNEY, orderJourneyIndex } from "../lib/journey";

function JourneyProgress({ status }: { status: string }) {
  const idx = orderJourneyIndex(status);
  const pct = idx >= 0 ? ((idx + 1) / ORDER_JOURNEY.length) * 100 : 0;
  return (
    <div className="w-full min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-muted-foreground">
          {idx >= 0
            ? `Step ${idx + 1} of ${ORDER_JOURNEY.length}`
            : "Order ended"}
        </span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            idx >= 0 ? "bg-primary" : "bg-muted-foreground/40"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AssignedChip({
  adminId,
  adminName,
}: {
  adminId?: string | null;
  adminName?: string | null;
}) {
  const role = adminId
    ? mockUsers.find((u) => u.id === adminId)?.role
    : undefined;
  if (!adminId || !adminName) {
    return <Badge variant="muted">Unassigned</Badge>;
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-[10px]">
          {initials(adminName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground/80">
          {adminName}
        </p>
        {role === "SUPER_ADMIN" && (
          <Badge variant="secondary" className="mt-0.5 text-[10px]">
            Super Admin
          </Badge>
        )}
      </div>
    </div>
  );
}

function TrackingCard({
  href,
  reference,
  statusBadge,
  status,
  adminId,
  adminName,
  children,
}: {
  href: string;
  reference: string;
  statusBadge: ReactNode;
  status: string;
  adminId?: string | null;
  adminName?: string | null;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={href}
            className="font-mono text-sm font-semibold text-primary hover:underline"
          >
            {reference}
          </Link>
          <span className="shrink-0">{statusBadge}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1 text-sm text-muted-foreground">
          {children}
        </div>

        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
          <JourneyProgress status={status} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <UserRound className="h-3 w-3" />
              Assigned
            </p>
            <AssignedChip adminId={adminId} adminName={adminName} />
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={href}>
              Track
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrackingOverviewPage() {
  const { bookings } = useBookingsStore();
  const { orders: branchOrders } = useBranchOrdersStore();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const agentOrders = [...bookings].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  const branchRows = [...branchOrders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Tracking"
        description="Track Agent and Branch orders in real time as they move through the fulfillment journey."
        breadcrumbs={[
          { label: "Operations", href: "/orders" },
          { label: "Live Tracking" },
        ]}
        actions={
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/5 text-primary"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live
            <span className="tabular-nums">
              {new Date(now).toLocaleTimeString()}
            </span>
          </Badge>
        }
      />

      <Tabs defaultValue="agent">
        <TabsList>
          <TabsTrigger value="agent">
            Agent Orders ({agentOrders.length})
          </TabsTrigger>
          <TabsTrigger value="branch">
            Branch Orders ({branchRows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agentOrders.map((booking) => (
              <TrackingCard
                key={booking.id}
                href={`/bookings/track/${booking.id}`}
                reference={booking.reference}
                statusBadge={
                  <StatusBadge
                    variant={getBookingStatusVariant(booking.status)}
                    label={humanize(booking.status)}
                  />
                }
                status={booking.status}
                adminId={booking.assignedAdminId}
                adminName={booking.assignedAdminName}
              >
                <p className="truncate font-medium text-foreground/80">
                  {booking.customerName}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {booking.branchName}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {relativeTime(booking.createdAt)}
                  {" · "}
                  {booking.items.length} item line
                  {booking.items.length === 1 ? "" : "s"}
                </p>
              </TrackingCard>
            ))}
          </div>
          {agentOrders.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Radio className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No agent orders to track yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="branch">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {branchRows.map((order) => (
              <TrackingCard
                key={order.id}
                href={`/tracking/branch/${order.id}`}
                reference={order.reference}
                statusBadge={
                  <StatusBadge
                    variant={getBranchOrderStatusVariant(order.status)}
                    label={humanize(order.status)}
                  />
                }
                status={order.status}
                adminId={order.assignedAdminId}
                adminName={order.assignedAdminName}
              >
                <p className="flex items-center gap-1 font-medium text-foreground/80">
                  <MapPin className="h-3.5 w-3.5" />
                  {order.branchName}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {relativeTime(order.createdAt)}
                  {" · "}
                  {order.items.length} item line
                  {order.items.length === 1 ? "" : "s"}
                </p>
              </TrackingCard>
            ))}
          </div>
          {branchRows.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                <Radio className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No branch orders to track yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}