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
  getBookingStatusVariant,
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

import { useBookingsStore } from "../hooks/useBookingsStore";
import { useAuth } from "@/hooks/useAuth";
import { mockUsers } from "@/data/mock-users";
import type { AuthUser } from "@/types/auth";
import {
  BOOKING_STATUS_FLOW,
  type BookingStatus,
} from "@/types/booking";
import {
  formatCurrency,
  formatDateTime,
  initials,
  relativeTime,
} from "@/lib/utils";

interface JourneyStep {
  key: BookingStatus;
  label: string;
  hint: string;
}

const JOURNEY: JourneyStep[] = [
  { key: "pending", label: "Pending", hint: "Booking submitted and awaiting approval" },
  { key: "accepted", label: "Accepted", hint: "Approved and ready to be assigned" },
  { key: "assigned", label: "Assigned to Admin", hint: "An admin has been assigned" },
  { key: "admin_accepted", label: "Admin Accepted", hint: "Accepted by the assigned admin" },
  { key: "processing", label: "Processing", hint: "Order is being prepared" },
  { key: "ready", label: "Ready for Pickup", hint: "Ready to be picked up" },
  { key: "completed", label: "Completed", hint: "Pickup was completed" },
  { key: "ready_for_delivery", label: "Ready for Delivery", hint: "Out for delivery / delivered" },
];

interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  by?: string;
  current: boolean;
}

export function BookingTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { getBooking, setStatus, assignBooking } = useBookingsStore();
  const { user } = useAuth();

  const booking = id ? getBooking(id) : undefined;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const history = booking?.statusHistory ?? [];
  const currentIdx = booking
    ? BOOKING_STATUS_FLOW.indexOf(booking.status)
    : -1;
  const isTerminal = booking
    ? ["cancelled", "rejected"].includes(booking.status)
    : false;

  const lastEvent = useMemo(
    () => history[history.length - 1],
    [history]
  );

  const activityEvents = useMemo<ActivityEvent[]>(() => {
    if (!booking) return [];
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
          current: entry.to === booking.status,
        }));
    }
    const fallback: ActivityEvent[] = [
      {
        id: `${booking.id}-created`,
        title: "Booking Created",
        timestamp: booking.createdAt,
        by: booking.agentName,
        current: false,
      },
    ];
    if (booking.assignmentDate) {
      fallback.push({
        id: `${booking.id}-assigned`,
        title: "Assigned to Admin",
        timestamp: booking.assignmentDate,
        by: booking.assignedByName ?? "",
        current: booking.status === "assigned",
      });
    }
    fallback.push({
      id: `${booking.id}-current`,
      title: `Current status: ${humanize(booking.status)}`,
      timestamp: booking.assignmentDate ?? booking.createdAt,
      current: true,
    });
    return fallback;
  }, [booking, history]);

  if (!booking) {
    return (
      <NotFound
        title="Booking not found"
        message="The booking you are trying to track does not exist."
        backHref="/bookings"
        backLabel="Back to bookings"
      />
    );
  }

  const totalItems = booking.items.reduce((sum, it) => sum + it.quantity, 0);

  const assignedAdmin =
    booking.assignedAdminId && booking.assignedAdminName
      ? {
          id: booking.assignedAdminId,
          fullName: booking.assignedAdminName,
        }
      : null;

  const nextStep = (): { status: BookingStatus; viaAssignment: boolean } | null => {
    switch (booking.status) {
      case "pending":
        return { status: "accepted", viaAssignment: false };
      case "accepted":
        return { status: "assigned", viaAssignment: true };
      case "assigned":
        return { status: "admin_accepted", viaAssignment: false };
      case "admin_accepted":
        return { status: "processing", viaAssignment: false };
      case "processing":
        return { status: "ready", viaAssignment: false };
      case "ready":
        return { status: "completed", viaAssignment: false };
      case "completed":
        return { status: "ready_for_delivery", viaAssignment: false };
      default:
        return null;
    }
  };

  const next = nextStep();
  const isDone = !next || booking.status === "ready_for_delivery";

  const simulateNext = () => {
    const step = nextStep();
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
        assignBooking(
          booking.id,
          { id: admin.id, fullName: admin.fullName },
          actor
        );
      } else {
        toast.error("No active admin available to assign.");
      }
      return;
    }
    setStatus(booking.id, step.status, actor);
  };

  const renderJourneyStep = (step: JourneyStep, index: number) => {
    const reachedKeys = new Set(history.map((hst) => hst.to));
    const done =
      reachedKeys.has(step.key) ||
      (currentIdx >= 0 && index < currentIdx);
    const current = booking.status === step.key;
    const entry = history.find((hst) => hst.to === step.key);
    const timestamp =
      entry?.timestamp ??
      (step.key === "pending"
        ? booking.createdAt
        : step.key === "assigned"
        ? booking.assignmentDate
        : null);

    return (
      <div key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
        {index < JOURNEY.length - 1 && (
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
        title={booking.reference}
        description={`${booking.customerName} · ${booking.branchName}`}
        breadcrumbs={[
          { label: "Operations", href: "/bookings" },
          { label: "Bookings", href: "/bookings" },
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
              variant={getBookingStatusVariant(booking.status)}
              label={humanize(booking.status)}
            />
            <Button asChild variant="outline" size="sm">
              <Link to={`/bookings/${booking.id}`}>
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
              Real-time booking tracking
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This page updates automatically whenever the booking status
              changes. Timestamps refresh in real time.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Last update:{" "}
            <span className="font-medium text-foreground/80">
              {lastEvent
                ? relativeTime(lastEvent.timestamp)
                : relativeTime(booking.createdAt)}
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
                Booking {humanize(booking.status)}
              </p>
              <p className="text-xs text-destructive/80">
                This booking is no longer progressing through the journey.
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
                Booking Journey
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {currentIdx >= 0
                    ? `Step ${currentIdx + 1} of ${JOURNEY.length}`
                    : humanize(booking.status)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>{JOURNEY.map(renderJourneyStep)}</CardContent>
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
                  variant={getBookingStatusVariant(booking.status)}
                  label={humanize(booking.status)}
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
                  {formatDateTime(booking.createdAt)}
                </span>
              </div>
              {booking.assignmentDate && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    Assigned
                  </span>
                  <span className="text-sm font-medium">
                    {formatDateTime(booking.assignmentDate)}
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
                Advance the booking through the journey using mock state. The
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
                    : "This booking cannot be advanced further."}
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
                  <UserRound className="h-4 w-4" />
                  Customer
                </span>
                <span className="font-medium">{booking.customerName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Agent</span>
                <span className="font-medium">{booking.agentName}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Branch
                </span>
                <span className="text-right font-medium">
                  {booking.branchName}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Pickup
                </span>
                <span className="font-medium">{booking.pickupDate}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Total items</span>
                <span className="font-medium">
                  {totalItems} (
                  {booking.items.map((it) => it.productName).join(", ")})
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}