import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, CircleDashed, Eye, Play, Radio, UserRound, XCircle } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NotFound } from "@/components/common/NotFound";
import { type JourneyStep, nextOrderStep, ORDER_JOURNEY, orderJourneyIndex } from "@/features/orders/lib/journey";
import { formatCurrency, formatDateTime, initials, relativeTime } from "@/lib/utils";

interface StatusHistoryEntry {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: string;
  by?: string;
}

export interface TrackingOrder {
  id: string;
  reference: string;
  status: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  assignmentDate?: string | null;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  assignedByName?: string | null;
  totalAmount: number;
  items: { productName: string; quantity: number }[];
}

export interface OrderTrackingViewProps {
  order: TrackingOrder | undefined;
  /** Noun used throughout the copy, e.g. "booking" or "order". */
  noun: string;
  description: string;
  breadcrumbs: { label: string; href?: string }[];
  detailHref: string;
  notFound: {
    title: string;
    message: string;
    backHref: string;
    backLabel: string;
  };
  isTerminal: boolean;
  /** Extra rows rendered in the summary card. */
  summaryRows?: { label: string; value: ReactNode }[];
  /**
   * Advances the order through the journey. Only wired up in development —
   * see the `Live Simulation` card below.
   */
  onSimulateNext?: () => void;
  /** Label for the next journey step, or `null` when the journey is done. */
  nextStepLabel?: string | null;
  isDone?: boolean;
}

interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  by?: string;
  current: boolean;
}

/**
 * The live tracking view shared by the booking and branch-order trackers.
 *
 * Both routes render the same journey, activity feed and status panel, so
 * the presentation lives here and each page only supplies its data.
 */
export function OrderTrackingView({
  order,
  noun,
  description,
  breadcrumbs,
  detailHref,
  notFound,
  isTerminal,
  summaryRows,
  onSimulateNext,
  nextStepLabel,
  isDone,
}: OrderTrackingViewProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const history = useMemo(() => order?.statusHistory ?? [], [order]);
  const currentIdx = order ? orderJourneyIndex(order.status) : -1;

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
        title: `${noun === "booking" ? "Booking" : "Order"} Created`,
        timestamp: order.createdAt,
        by: order.assignedByName ?? undefined,
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
  }, [order, history, noun]);

  if (!order) {
    return (
      <NotFound
        title={notFound.title}
        message={notFound.message}
        backHref={notFound.backHref}
        backLabel={notFound.backLabel}
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

  const renderJourneyStep = (step: JourneyStep, index: number) => {
    const reachedKeys = new Set(history.map((hst) => hst.to));
    const done =
      reachedKeys.has(step.key) || (currentIdx >= 0 && index < currentIdx);
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
      <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
        {index < ORDER_JOURNEY.length - 1 && (
          <span
            className={`absolute left-[15px] top-8 h-full w-0.5 ${
              done ? "bg-primary/60" : "bg-border"
            }`}
            aria-hidden
          />
        )}
        <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center">
          {current ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background">
              <Radio className="h-4 w-4 text-primary" aria-hidden />
            </span>
          ) : done ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background text-muted-foreground">
              <CircleDashed className="h-4 w-4" aria-hidden />
            </span>
          )}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className={`text-sm font-semibold ${
                current
                  ? "text-primary"
                  : done
                    ? "text-foreground"
                    : "text-muted-foreground"
              }`}
            >
              {step.label}
            </p>
            {current && (
              <Badge variant="secondary" className="text-xs">
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
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.reference}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/40 bg-primary/5 text-primary"
            >
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
              Live
            </Badge>
            <StatusBadge
              variant={getStatusVariant(order.status)}
              label={humanize(order.status)}
            />
            <Button asChild variant="outline" size="sm">
              <Link to={detailHref}>
                <Eye className="h-4 w-4" aria-hidden />
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
              <Radio className="h-4 w-4" aria-hidden />
              Real-time {noun} tracking
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This page updates automatically whenever the {noun} status
              changes. Timestamps refresh in real time.
            </p>
          </div>
          <p
            className="text-xs text-muted-foreground"
            aria-live="off"
            aria-atomic="false"
          >
            Last update:{" "}
            <span className="font-medium text-foreground/80">
              {lastEvent
                ? relativeTime(lastEvent.timestamp)
                : relativeTime(order.createdAt)}
            </span>
            {" · "}
            <time className="tabular-nums" dateTime={new Date(now).toISOString()}>
              {new Date(now).toLocaleTimeString()}
            </time>
          </p>
        </CardContent>
      </Card>

      {isTerminal && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <XCircle className="h-5 w-5 text-destructive" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {noun === "booking" ? "Booking" : "Order"}{" "}
                {humanize(order.status)}
              </p>
              <p className="text-xs text-destructive/80">
                This {noun} is no longer progressing through the journey.
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
                {noun === "booking" ? "Booking" : "Order"} Journey
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {currentIdx >= 0
                    ? `Step ${currentIdx + 1} of ${ORDER_JOURNEY.length}`
                    : humanize(order.status)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative">{ORDER_JOURNEY.map(renderJourneyStep)}</ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {activityEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              ) : (
                activityEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-muted/40"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        event.current ? "bg-primary" : "bg-muted-foreground/40"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <span className="text-sm font-medium text-foreground">
                          {event.title}
                        </span>
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
                ))
              )}
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
                  variant={getStatusVariant(order.status)}
                  label={humanize(order.status)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <UserRound className="h-4 w-4" aria-hidden />
                  Assigned admin
                </span>
                {assignedAdmin ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px]">
                        {initials(assignedAdmin.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate text-sm font-medium text-foreground">
                      {assignedAdmin.fullName}
                    </span>
                  </div>
                ) : (
                  <Badge variant="muted" className="text-xs">
                    Unassigned
                  </Badge>
                )}
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium text-foreground">
                  {formatDateTime(order.createdAt)}
                </span>
              </div>
              {order.assignmentDate && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Assigned</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDateTime(order.assignmentDate)}
                  </span>
                </div>
              )}
              {lastEvent && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">Last update</span>
                  <span className="text-sm font-medium text-foreground">
                    {relativeTime(lastEvent.timestamp)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {import.meta.env.DEV && onSimulateNext && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Live Simulation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Development only. Advance the {noun} through the journey using
                  mock state — the tracking view updates instantly below.
                </p>
                <Button
                  className="w-full gap-2"
                  disabled={!nextStepLabel}
                  onClick={onSimulateNext}
                >
                  <Play className="h-4 w-4" aria-hidden />
                  {nextStepLabel
                    ? `Simulate: ${nextStepLabel}`
                    : "Journey complete"}
                </Button>
                {!nextStepLabel && (
                  <p className="text-center text-xs text-muted-foreground" role="status">
                    {isDone
                      ? "All steps have been reached."
                      : `This ${noun} cannot be advanced further.`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {summaryRows?.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-2"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="text-right font-medium text-foreground">
                    {row.value}
                  </span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Total items</span>
                <span className="text-right font-medium text-foreground">
                  {totalItems} ({order.items.map((it) => it.productName).join(", ")})
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold tabular-nums text-foreground">
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

/** Exposed so pages can compute the next step label consistently. */
export { nextOrderStep };
