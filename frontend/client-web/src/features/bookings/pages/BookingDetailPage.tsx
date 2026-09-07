import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  History,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShieldAlert,
  Truck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import {
  StatusBadge,
  getBookingStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { useBookingsStore } from "../hooks/useBookingsStore";
import { AssignmentDialog } from "../components/AssignmentDialog";
import { mockCustomers } from "@/data/mock-customers";
import { mockAgents } from "@/data/mock-agents";
import { mockUsers } from "@/data/mock-users";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
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
  const { getBooking, setStatus, assignBooking, reassignBooking } =
    useBookingsStore();
  const { can, isSuperAdmin } = usePermissions();
  const { user } = useAuth();

  const booking = id ? getBooking(id) : undefined;
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  if (!booking) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/bookings">
            <ArrowLeft className="h-4 w-4" />
            Back to bookings
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Booking not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = mockCustomers.find((c) => c.id === booking.customerId);
  const agent = mockAgents.find((a) => a.id === booking.agentId);

  const timeline = buildTimeline(booking);
  const canUpdate = can("bookings.update");
  const isAssignedToMe =
    !!user?.id && booking.assignedAdminId === user.id;
  const canProcessBooking = isAssignedToMe;
  const isTerminal = ["completed", "cancelled", "rejected"].includes(
    booking.status
  );

  const actionButtons = buildActionButtons(
    booking,
    {
      canProcess: canUpdate && canProcessBooking,
    },
    {
      onAccept: () => setStatus(booking.id, "accepted"),
      onProcess: () => setStatus(booking.id, "processing"),
      onReady: () => setStatus(booking.id, "ready"),
      onComplete: () => setStatus(booking.id, "completed"),
    }
  );

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
      {isSuperAdmin &&
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
      {isSuperAdmin &&
        !isTerminal &&
        booking.status === "accepted" &&
        !booking.assignedAdminId && (
          <Button size="sm" onClick={() => setAssignmentOpen(true)}>
            <UserCheck className="h-4 w-4" />
            Assign Booking
          </Button>
        )}
      {isSuperAdmin &&
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
              variant={getBookingStatusVariant(booking.status)}
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Product</th>
                    <th className="py-2 text-right font-medium">Quantity</th>
                    <th className="py-2 text-right font-medium">Unit Price</th>
                    <th className="py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.items.map((item) => (
                    <tr key={item.productId} className="border-t">
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right">{item.quantity}</td>
                      <td className="py-2.5 text-right">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Separator />
            <div className="ml-auto max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatCurrency(booking.subtotal)} />
              <Row
                label="Discounts"
                value={`-${formatCurrency(booking.discount)}`}
              />
              <Separator />
              <Row
                label="Total"
                value={formatCurrency(booking.totalAmount)}
                highlight
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
              <InfoLine
                icon={User}
                label={customer?.fullName ?? booking.customerName}
              />
              <InfoLine icon={Phone} label={customer?.contactNumber ?? "—"} />
              <InfoLine icon={Mail} label={customer?.email ?? "—"} />
              <InfoLine icon={MapPin} label={customer?.address ?? "—"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine
                icon={User}
                label={agent?.fullName ?? booking.agentName}
              />
              <InfoLine icon={Phone} label={agent?.contactNumber ?? "—"} />
              <InfoLine icon={Mail} label={agent?.email ?? "—"} />
              <InfoLine icon={MapPin} label={agent?.address ?? "—"} />
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
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
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
            {booking.assignmentDate && (
              <SummaryLine
                label="Last Updated"
                value={formatDateTime(booking.assignmentDate)}
              />
            )}
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

      {user &&
        isSuperAdmin &&
        !isTerminal &&
        (booking.status === "accepted" || booking.assignedAdminId) && (
          <AssignmentDialog
            open={assignmentOpen}
            onOpenChange={setAssignmentOpen}
            booking={booking}
            admins={mockUsers}
            currentUser={user}
            onAssign={(admin, by) => {
              if (booking.status === "accepted") {
                assignBooking(booking.id, admin, by);
              } else {
                reassignBooking(booking.id, admin, by);
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
    onProcess: () => void;
    onReady: () => void;
    onComplete: () => void;
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

    case "accepted":
    case "confirmed":
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
        label: "Complete Order",
        icon: CheckCircle2,
        onClick: handlers.onComplete,
      });
      break;

    case "pending":
    case "completed":
    case "cancelled":
    case "rejected":
    default:
      break;
  }

  return buttons;
}

function buildTimeline(booking: Booking) {
  const sequence: BookingStatus[] = [
    "pending",
    "accepted",
    "assigned",
    "confirmed",
    "processing",
    "ready",
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
      by: isCurrent
        ? booking.assignedAdminId
          ? "Admin"
          : "Super Admin"
        : "",
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

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={highlight ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </span>
      <span className={highlight ? "text-base font-semibold" : ""}>{value}</span>
    </div>
  );
}
