import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Eye,
  MapPin,
  Play,
  Radio,
  UserRound,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import {
  StatusBadge,
  getBranchOrderStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NotFound } from "@/components/common/NotFound";

import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { mockUsers } from "@/data/mock-users";
import type { AuthUser } from "@/types/auth";
import type { BranchOrderStatus } from "@/types/branch-order";
import {
  type JourneyStep,
  nextOrderStep,
  ORDER_JOURNEY,
  orderJourneyIndex,
} from "../lib/journey";
import {
  formatCurrency,
  formatDateTime,
  initials,
  relativeTime,
} from "@/lib/utils";

interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  by?: string;
  current: boolean;
}

export function BranchOrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { getOrder, setStatus, assignOrder } = useBranchOrdersStore();
  const { user } = useAuth();

  const order = id ? getOrder(id) : undefined;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const history = order?.statusHistory ?? [];
  const currentIdx = order ? orderJourneyIndex(order.status) : -1;
  const isTerminal = order ? order.status === "rejected" : false;

  const lastEvent = useMemo(
    () => history[history.length - 1],
    [history]
  );

  const activityEvents = useMemo<ActivityEvent[]>(() => {
    if (!order) return [];
    if (history.length > 0) {
      return [...history]
        .reverse()
        .map((entry) => ({
          id: entry.id,
          title: entry.label,
          description:
            entry.from !== entry.to
              ? `From ${humanize(entry.from)} to ${humanize(entry.to)}`
              : undefined,
          timestamp: entry.timestamp,
          by: entry.by,
          current: entry.to === order.status,
        }));
    }
    const fallback: ActivityEvent[] = [
      {
        id: `${order.id}-created`,
        title: "Order Created",
        timestamp: order.createdAt,
        by: order.branchName,
        current: false,
      },
    ];
    if (order.assignmentDate) {
      fallback.push({
        id: `${order.id}-assigned`,
        title: "Assigned to Admin",
        timestamp: order.assignmentDate,
        by: order.assignedByName ?? "",
        current: order.status === "assigned",
      });
    }
    fallback.push({
      id: `${order.id}-current`,
      title: `Current status: ${humanize(order.status)}`,
      timestamp: order.assignmentDate ?? order.createdAt,
      current: true,
    });
    return fallback;
  }, [order, history]);

  if (!order) {
    return (
      <NotFound
        title="Order not found"
        message="The branch order you are trying to track does not exist."
        backHref="/orders"
        backLabel="Back to orders"
      />
    );
  }

  const totalItems = order.items.reduce((sum, it) => sum + it.quantity, 0);

  const assignedAdmin =
    order.assignedAdminId && order.assignedAdminName
      ? {
          id: order.assignedAdminId,
          fullName: order.assignedAdminName,
        }
      : null;

  const next = nextOrderStep(order.status);
  const isDone = !next || order.status === "ready_for_delivery";

  const simulateNext = () => {
    const step = nextOrderStep(order.status);
    if (!step) return;
    const actor: Pick<AuthUser, "id" | "fullName"> = user ?? {
      id: "USR-001",
      fullName: "Juan Dela Cruz",
    };
    if (step.viaAssignment) {
      const admin = mockUsers.find(
        (u) => u.role === "ADMIN" && u.status === "active"
      );
      if (admin) {
        assignOrder(
          order.id,
          { id: admin.id, fullName: admin.fullName },
          actor
        );
      } else {
        toast.error("No active admin available to assign.");
      }
      return;
    }
    setStatus(order.id, step.status as BranchOrderStatus, actor);
  };

  const renderJourneyStep = (step: JourneyStep, index: number) => {
    const reachedKeys = new Set(history.map((hst) => hst.to));
    const done =
      reachedKeys.has(step.key) ||
      (currentIdx >= 0 && index < currentIdx);
    const current = order.status === step.key;
    const entry = history.find((hst) => hst.to === step.key);
    const timestamp =
      entry?.timestamp ??
      (step.key === "pending"
        ? order.createdAt
        : step.key === "assigned"
        ? order.assignmentDate
        : null);

    return (
      <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
        {index < ORDER_JOURNEY.length - 1 && (
          <span
            className={`absolute left-[15px] top-8 h-full w-0.5 ${
              done ? "bg-primary/60" : "bg-border"
            }`}
          />
        )}
        <div className="relative mt-0.5">
          {current ? (
            <span className="relative flex h-8 w-8 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
                <Radio className="h-4 w-4 text-primary" />
              </span>
            </span>
          ) : done ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background text-muted-foreground">
              <CircleDashed className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={`text-sm font-semibold ${
                current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>
            {current && (
              <Badge variant="secondary" className="animate-pulse">
                Current
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{step.hint}</p>
          {timestamp && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {relativeTime(timestamp)}
              </span>
              {" · "}
              {formatDateTime(timestamp)}
              {entry?.by ? ` · by ${entry.by}` : ""}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.reference}
        description={order.branchName}
        breadcrumbs={[
          { label: "Operations", href: "/orders" },
          { label: "Orders", href: "/orders" },
          { label: "Live Tracking" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 bg-primary/5 text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live
            </Badge>
            <StatusBadge
              variant={getBranchOrderStatusVariant(order.status)}
              label={humanize(order.status)}
            />
            <Button asChild variant="outline" size="sm">
              <Link to={`/orders/branch/${order.id}`}>
                <Eye className="h-4 w-4" />
                View Details
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Radio className="h-4 w-4" />
              Real-time order tracking
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This page updates automatically whenever the order status
              changes. Timestamps refresh in real time.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Last update:{" "}
            <span className="font-medium text-foreground/80">
              {lastEvent
                ? relativeTime(lastEvent.timestamp)
                : relativeTime(order.createdAt)}
            </span>
            {" · "}
            <span className="tabular-nums">
              {new Date(now).toLocaleTimeString()}
            </span>
          </p>
        </CardContent>
      </Card>

      {isTerminal && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                Order {humanize(order.status)}
              </p>
              <p className="text-xs text-destructive/80">
                This order is no longer progressing through the journey.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Order Journey
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {currentIdx >= 0
                    ? `Step ${currentIdx + 1} of ${ORDER_JOURNEY.length}`
                    : humanize(order.status)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>{ORDER_JOURNEY.map(renderJourneyStep)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted/40"
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      event.current ? "bg-primary" : "bg-muted-foreground/40"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-sm font-medium">{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {relativeTime(event.timestamp)}
                      </span>
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(event.timestamp)}
                      {event.by ? ` · by ${event.by}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge
                  variant={getBranchOrderStatusVariant(order.status)}
                  label={humanize(order.status)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserRound className="h-4 w-4" />
                  Assigned admin
                </span>
                {assignedAdmin ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {initials(assignedAdmin.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {assignedAdmin.fullName}
                    </span>
                  </div>
                ) : (
                  <Badge variant="muted" className="text-[10px]">
                    Unassigned
                  </Badge>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {formatDateTime(order.createdAt)}
                </span>
              </div>
              {order.assignmentDate && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Assigned
                  </span>
                  <span className="text-sm font-medium">
                    {formatDateTime(order.assignmentDate)}
                  </span>
                </div>
              )}
              {lastEvent && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Last update
                  </span>
                  <span className="text-sm font-medium">
                    {relativeTime(lastEvent.timestamp)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Live Simulation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Advance the order through the journey using mock state. The
                tracking view updates instantly below.
              </p>
              <Button
                className="w-full gap-2"
                disabled={!next}
                onClick={simulateNext}
              >
                <Play className="h-4 w-4" />
                {next ? `Simulate: ${humanize(next.status)}` : "Journey complete"}
              </Button>
              {!next && (
                <p className="text-center text-xs text-muted-foreground">
                  {isDone
                    ? "All steps have been reached."
                    : "This order cannot be advanced further."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Branch
                </span>
                <span className="text-right font-medium">
                  {order.branchName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Order date
                </span>
                <span className="font-medium">{order.orderDate}</span>
              </div>
              {order.notes && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground">Notes</span>
                  <span className="max-w-[60%] text-right font-medium">
                    {order.notes}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Total items</span>
                <span className="font-medium">
                  {totalItems} (
                  {order.items.map((it) => it.productName).join(", ")})
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}