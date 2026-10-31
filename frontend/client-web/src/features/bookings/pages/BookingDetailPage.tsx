import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  History,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  Trash2,
  Truck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { OrderItemsTable } from "@/components/common/OrderItemsTable";
import { DetailRow } from "@/components/common/DescriptionList";
import { NotFound } from "@/components/common/NotFound";
import { ErrorState } from "@/components/common/ErrorState";

import { useBookingsStore } from "../hooks/useBookingsStore";
import { useBookingLookups } from "../hooks/useBookingLookups";
import { AssignmentDialog } from "../components/AssignmentDialog";
import { deleteBooking as deleteBookingRequest } from "../services/bookings.service";
import { ApiError } from "@/lib/api-client";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { TERMINAL_STATUSES } from "@/types/booking";
import type { Booking, BookingStatus } from "@/types/booking";

interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getBooking,
    loadBooking,
    removeBooking,
    loading,
    error,
    setStatus,
    assignBooking,
    reassignBooking,
  } = useBookingsStore();
  const { can, role, isSuperAdmin } = usePermissions();
  const isAdminUser = role === "ADMIN" || role === "SUPER_ADMIN";
  const { user } = useAuth();
  const { admins } = useBookingLookups(isAdminUser);

  const booking = id ? getBooking(id) : undefined;
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || getBooking(id)) {
      setLoadAttempted(true);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    void loadBooking(id)
      .then((result) => {
        if (!cancelled && !result) {
          setLoadError("Could not load booking. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadAttempted(true);
      });
    return () => {
      cancelled = true;
    };
    // getBooking intentionally omitted: the id is the load trigger and the
    // store cache is checked at effect time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadBooking]);

  if (!booking) {
    const waiting = loading || !loadAttempted;
    const displayError = loadError ?? error;
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/bookings">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to bookings
          </Link>
        </Button>
        {waiting ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-64 lg:col-span-2" />
              <Skeleton className="h-64" />
            </div>
          </div>
        ) : displayError ? (
          <ErrorState
            title="Could not load booking"
            message={displayError}
            onRetry={() => {
              setLoadError(null);
              setLoadAttempted(false);
              if (id) {
                void loadBooking(id)
                  .then((result) => {
                    if (!result) {
                      setLoadError("Could not load booking. Please try again.");
                    }
                  })
                  .finally(() => setLoadAttempted(true));
              }
            }}
          />
        ) : (
          <NotFound
            title="Booking not found"
            message="The booking you are looking for does not exist."
            backHref="/bookings"
            backLabel="Back to bookings"
          />
        )}
      </div>
    );
  }

  const timeline = buildTimeline(booking);
  const canUpdate = can("bookings.update");
  const isAssignedToMe =
    !!user?.id && booking.assignedAdminId === user.id;
  const canProcessBooking = isAssignedToMe || isSuperAdmin;
  const isTerminal = TERMINAL_STATUSES.includes(booking.status);

  const actionButtons = buildActionButtons(
    booking,
    {
      canProcess: canUpdate && canProcessBooking,
    },
    {
      onAccept: () => setStatus(booking.id, "admin_accepted"),
      onReview: () => setStatus(booking.id, "review_order"),
      onProcess: () => setStatus(booking.id, "processing"),
      onReady: () => setStatus(booking.id, "ready"),
      onReadyForDelivery: () => setStatus(booking.id, "ready_for_delivery"),
    }
  );

  const canDelete =
    can("bookings.delete") &&
    ["pending", "accepted", "assigned", "admin_accepted", "cancelled", "rejected"].includes(
      booking.status,
    );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBookingRequest(booking.id);
      removeBooking(booking.id);
      toast.success("Booking deleted", {
        description: `${booking.reference} was removed.`,
      });
      navigate("/bookings");
    } catch (err) {
      toast.error("Could not delete booking", {
        description:
          err instanceof ApiError
            ? err.message
            : "The booking was not deleted. Please try again.",
      });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {actionButtons.map((btn) => (
        <Button
          key={btn.label}
          size="sm"
          variant={btn.variant ?? "default"}
          onClick={btn.onClick}
        >
          {btn.icon ? <btn.icon className="h-4 w-4" /> : null}
          {btn.label}
        </Button>
      ))}
      {isAdminUser &&
        !isTerminal &&
        booking.status === "pending" && (
          <>
            <Button size="sm" onClick={() => setStatus(booking.id, "accepted")}>
              <CheckCircle2 className="h-4 w-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setRejectOpen(true)}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}
      {canUpdate &&
        !isTerminal &&
        (isSuperAdmin || isAssignedToMe) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        )}
      {canDelete && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setDeleteOpen(true)}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete"}
        </Button>
      )}
      {isAdminUser &&
        !isTerminal &&
        booking.status === "accepted" &&
        !booking.assignedAdminId && (
          <Button size="sm" onClick={() => setAssignmentOpen(true)}>
            <UserCheck className="h-4 w-4" />
            Assign Booking
          </Button>
        )}
      {isAdminUser &&
        !isTerminal &&
        booking.assignedAdminId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAssignmentOpen(true)}
          >
            <RefreshCw className="h-4 w-4" />
            Re-Assign
          </Button>
        )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/bookings")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to bookings
      </Button>

      <PageHeader
        title={booking.reference}
        description={`${booking.customerName} · ${booking.items.length} item(s)`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Bookings", href: "/bookings" },
          { label: booking.reference },
        ]}
        actions={
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              variant={getStatusVariant(booking.status)}
              label={humanize(booking.status)}
            />
            {headerActions}
          </div>
        }
      />

      {!isSuperAdmin &&
        booking.assignedAdminId &&
        !isAssignedToMe &&
        !["completed", "cancelled", "rejected"].includes(booking.status) && (
          <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              This booking is assigned to{" "}
              <span className="font-medium text-foreground">
                {booking.assignedAdminName}
              </span>
              . You can view its details but cannot process it.
            </div>
          </div>
        )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Ordered Items</CardTitle>
            <div className="text-xs text-muted-foreground">
              {booking.totalQuantity} units
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <OrderItemsTable
              items={booking.items.map((item) => ({
                key: item.id,
                productName: item.productName,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              }))}
            />
            <Separator />
            <div className="ml-auto max-w-xs space-y-2">
              <DetailRow label="Subtotal" value={formatCurrency(booking.subtotal)} />
              <DetailRow
                label="Discounts"
                value={`-${formatCurrency(booking.discount)}`}
              />
              <Separator />
              <DetailRow
                label="Total"
                value={formatCurrency(booking.totalAmount)}
                emphasis
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine icon={User} label={booking.customerName} />
              <InfoLine
                icon={Phone}
                label={booking.customerContact || "No contact number"}
              />
              <InfoLine
                icon={MapPin}
                label={booking.customerAddress || "No address provided"}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine icon={User} label={booking.agentName} />
              <InfoLine
                icon={UserCheck}
                label={
                  booking.agentId
                    ? `Agent ID: ${booking.agentId}`
                    : "Agent ID not recorded"
                }
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine
                icon={CalendarDays}
                label={`Booked: ${formatDate(booking.bookingDate)}`}
              />
              <InfoLine
                icon={Truck}
                label={`Pickup: ${formatDate(booking.pickupDate)}`}
              />
              <InfoLine
                icon={UserCheck}
                label={
                  booking.assignedAdminName
                    ? `Assigned Admin: ${booking.assignedAdminName}`
                    : "Assigned Admin: —"
                }
              />
              {booking.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Notes
                    </div>
                    <p className="mt-1 text-sm">{booking.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline events={timeline} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Booking Summary</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryLine label="Reference" value={booking.reference} />
            <SummaryLine label="Status" value={humanize(booking.status)} />
            <SummaryLine
              label="Assigned Admin"
              value={booking.assignedAdminName ?? "—"}
            />
            <SummaryLine
              label="Created"
              value={formatDateTime(booking.createdAt)}
            />
            <SummaryLine
              label="Last Updated"
              value={formatDateTime(booking.updatedAt)}
            />
            <Separator />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject this booking?"
        description={`This will reject booking ${booking.reference}. This action cannot be undone.`}
        confirmText="Reject"
        destructive
        onConfirm={() => {
          setStatus(booking.id, "rejected");
          setRejectOpen(false);
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this booking?"
        description={`This will cancel booking ${booking.reference} and release any stock already committed to it. This action cannot be undone.`}
        confirmText="Cancel booking"
        destructive
        onConfirm={() => {
          setStatus(booking.id, "cancelled");
          setCancelOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this booking?"
        description={`This will permanently delete ${booking.reference}. Only bookings without outstanding committed stock can be deleted.`}
        confirmText={deleting ? "Deleting..." : "Delete booking"}
        destructive
        onConfirm={() => void handleDelete()}
      />

      {user &&
        isAdminUser &&
        !isTerminal &&
        (booking.status === "accepted" || booking.assignedAdminId) && (
          <AssignmentDialog
            open={assignmentOpen}
            onOpenChange={setAssignmentOpen}
            target={{
              reference: booking.reference,
              details: `${booking.customerName} · ${booking.branchName}`,
              assignedAdminId: booking.assignedAdminId,
              assignedAdminName: booking.assignedAdminName,
              assignedByName: booking.assignedByName,
              assignmentDate: booking.assignmentDate,
            }}
            admins={admins}
            currentUser={user}
            onAssign={(admin, by) => {
              if (booking.assignedAdminId) {
                void reassignBooking(booking.id, admin, by);
              } else {
                void assignBooking(booking.id, admin, by);
              }
            }}
          />
        )}
    </div>
  );
}

function buildActionButtons(
  booking: Booking,
  perms: { canProcess: boolean },
  handlers: {
    onAccept: () => void;
    onReview: () => void;
    onProcess: () => void;
    onReady: () => void;
    onReadyForDelivery: () => void;
  }
): ActionButton[] {
  const buttons: ActionButton[] = [];
  const { status } = booking;
  if (!perms.canProcess) return buttons;

  switch (status) {
    case "assigned":
      buttons.push({
        label: "Accept Order",
        icon: CheckCircle2,
        onClick: handlers.onAccept,
      });
      break;

    case "admin_accepted":
    case "confirmed":
      buttons.push({
        label: "Review Order",
        icon: CheckCircle2,
        onClick: handlers.onReview,
      });
      break;

    case "review_order":
      buttons.push({
        label: "Process Order",
        icon: CheckCircle2,
        onClick: handlers.onProcess,
      });
      break;

    case "processing":
      buttons.push({
        label: "Mark as Ready",
        icon: CheckCircle2,
        onClick: handlers.onReady,
      });
      break;

    case "ready":
      buttons.push({
        label: "Ready for Delivery",
        icon: CheckCircle2,
        onClick: handlers.onReadyForDelivery,
      });
      break;

    case "pending":
    case "accepted":
    case "ready_for_delivery":
    case "cancelled":
    case "rejected":
    default:
      break;
  }

  return buttons;
}

function buildTimeline(booking: Booking) {
  if (booking.statusHistory && booking.statusHistory.length > 0) {
    return booking.statusHistory.map((entry, index) => ({
      id: entry.id,
      title: entry.label || humanize(entry.to),
      description:
        entry.from && entry.from !== entry.to
          ? `From ${humanize(entry.from)} to ${humanize(entry.to)}`
          : "",
      timestamp: formatDateTime(entry.timestamp),
      by: entry.by,
      active:
        index === booking.statusHistory!.length - 1 ||
        entry.to === booking.status,
    }));
  }

  const sequence: BookingStatus[] = [
    "pending",
    "accepted",
    "assigned",
    "admin_accepted",
    "review_order",
    "processing",
    "ready",
    "ready_for_delivery",
    "completed",
  ];
  const currentIdx = sequence.indexOf(booking.status);
  const events: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    by: string;
    active?: boolean;
  }[] = [];

  events.push({
    id: `${booking.id}-created`,
    title: "Booking Created",
    description: `${booking.reference} was placed by the customer.`,
    timestamp: formatDateTime(booking.createdAt),
    by: "System",
  });

  if (booking.assignmentDate || booking.assignedAdminName) {
    events.push({
      id: `${booking.id}-assigned`,
      title: `Assigned to ${booking.assignedAdminName ?? "Admin"}`,
      description: booking.assignedByName
        ? `Assigned by ${booking.assignedByName} for review and processing.`
        : "Booking was assigned to an admin for processing.",
      timestamp: booking.assignmentDate
        ? formatDateTime(booking.assignmentDate)
        : "",
      by: booking.assignedByName ?? "Super Admin",
      active: booking.status === "assigned",
    });
  }

  sequence.slice(1).forEach((status, idx) => {
    if (currentIdx < idx + 1 && status !== booking.status) return;
    const isCurrent = status === booking.status;
    events.push({
      id: `${booking.id}-${status}`,
      title: humanize(status),
      description: isCurrent
        ? `Booking is currently ${humanize(status).toLowerCase()}.`
        : "",
      timestamp: isCurrent ? formatDateTime(booking.createdAt) : "",
      by: isCurrent ? (booking.assignedAdminId ? "Admin" : "Super Admin") : "",
      active: isCurrent,
    });
  });

  if (booking.status === "cancelled") {
    events.push({
      id: `${booking.id}-cancelled`,
      title: "Cancelled",
      description: "Booking was cancelled.",
      timestamp: formatDateTime(booking.createdAt),
      by: "Admin",
      active: true,
    });
  }
  if (booking.status === "rejected") {
    events.push({
      id: `${booking.id}-rejected`,
      title: "Rejected",
      description: "Booking was rejected.",
      timestamp: formatDateTime(booking.createdAt),
      by: "Admin",
      active: true,
    });
  }
  return events;
}

function InfoLine({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{label}</span>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

