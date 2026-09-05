import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
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
  UserPlus,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { mockBranches } from "@/data/mock-branches";
import { mockUsers } from "@/data/mock-users";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";
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
  const { can } = usePermissions();
  const { user } = useAuth();

  const booking = id ? getBooking(id) : undefined;
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [confirmAction, setConfirmAction] =
    useState<{ kind: "reject" | "cancel" } | null>(null);

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
  const branch = mockBranches.find((b) => b.id === booking.branchId);

  const timeline = buildTimeline(booking);
  const canApprove = can("bookings.approve");
  const canUpdate = can("bookings.update");
  const canAssign = can("bookings.assign");
  const isSuperAdmin = canAssign;
  const isAssignedToMe =
    !!user?.id && booking.assignedAdminId === user.id;
  const canActOnBooking = isSuperAdmin || isAssignedToMe;

  const actionButtons = buildActionButtons(
    booking,
    {
      canApprove: canApprove && canActOnBooking,
      canUpdate: canUpdate && canActOnBooking,
    },
    {
      onConfirm: () => setStatus(booking.id, "confirmed"),
      onReject: () => setConfirmAction({ kind: "reject" }),
      onCancel: () => setConfirmAction({ kind: "cancel" }),
      onProcessing: () => setStatus(booking.id, "processing"),
      onReady: () => setStatus(booking.id, "ready"),
      onComplete: () => setStatus(booking.id, "completed"),
    }
  );

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.kind === "reject") {
      setStatus(booking.id, "rejected");
    } else if (confirmAction.kind === "cancel") {
      setStatus(booking.id, "cancelled");
    }
    setConfirmAction(null);
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
                    <th className="py-2 text-left font-medium">SKU</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Unit</th>
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
                      <td className="py-2.5 font-mono text-xs text-muted-foreground">
                        {item.sku}
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
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {booking.assignedAdminName ? (
                <>
                  <div className="flex items-start gap-2">
                    <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        Assigned To
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {initials(booking.assignedAdminName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {booking.assignedAdminName}
                        </span>
                      </div>
                    </div>
                  </div>
                  <InfoLine
                    icon={User}
                    label={`Assigned By: ${booking.assignedByName ?? "—"}`}
                  />
                  <InfoLine
                    icon={CalendarDays}
                    label={`Assigned: ${
                      booking.assignmentDate
                        ? formatDateTime(booking.assignmentDate)
                        : "—"
                    }`}
                  />
                </>
              ) : (
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  This booking has not been assigned yet.
                  {canAssign ? (
                    <> Use “Assign” to assign it to an admin.</>
                  ) : (
                    <> Awaiting assignment from a Super Admin.</>
                  )}
                </div>
              )}
              {canAssign && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAssignmentOpen(true)}
                >
                  {booking.assignedAdminName ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Reassign booking
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Assign to admin
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine
                icon={Building2}
                label={branch?.name ?? booking.branchName}
              />
              <InfoLine
                icon={User}
                label={`Agent: ${agent?.fullName ?? booking.agentName}`}
              />
              <InfoLine
                icon={CalendarDays}
                label={`Booked: ${formatDate(booking.bookingDate)}`}
              />
              <InfoLine
                icon={Truck}
                label={`Pickup: ${formatDate(booking.pickupDate)}`}
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
            <Button asChild variant="outline" className="w-full" size="sm">
              <Link to="/bookings/history">View full history</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title={
          confirmAction?.kind === "reject"
            ? "Reject this booking?"
            : "Cancel this booking?"
        }
        description={
          confirmAction?.kind === "reject"
            ? `This will reject booking ${booking.reference}. This action cannot be undone.`
            : `This will cancel booking ${booking.reference}. This action cannot be undone.`
        }
        confirmText={
          confirmAction?.kind === "reject" ? "Reject" : "Cancel booking"
        }
        destructive
        onConfirm={handleConfirmAction}
      />

      {user && (
        <AssignmentDialog
          open={assignmentOpen}
          onOpenChange={setAssignmentOpen}
          booking={booking}
          admins={mockUsers}
          currentUser={user}
          onAssign={(admin, by) => {
            if (booking.assignedAdminId) {
              reassignBooking(booking.id, admin, by);
            } else {
              assignBooking(booking.id, admin, by);
            }
          }}
        />
      )}
    </div>
  );
}

function buildActionButtons(
  booking: Booking,
  perms: { canApprove: boolean; canUpdate: boolean },
  handlers: {
    onConfirm: () => void;
    onReject: () => void;
    onCancel: () => void;
    onProcessing: () => void;
    onReady: () => void;
    onComplete: () => void;
  }
): ActionButton[] {
  const buttons: ActionButton[] = [];
  const { status } = booking;
  const { canApprove, canUpdate } = perms;

  switch (status) {
    case "assigned":
    case "pending":
      if (canApprove) {
        buttons.push({
          label: "Confirm",
          icon: CheckCircle2,
          onClick: handlers.onConfirm,
        });
        buttons.push({
          label: "Reject",
          variant: "destructive",
          icon: XCircle,
          onClick: handlers.onReject,
        });
      }
      if (canUpdate) {
        buttons.push({
          label: "Cancel",
          variant: "outline",
          icon: XCircle,
          onClick: handlers.onCancel,
        });
      }
      break;

    case "confirmed":
      if (canUpdate) {
        buttons.push({
          label: "Mark as Processing",
          icon: CheckCircle2,
          onClick: handlers.onProcessing,
        });
        buttons.push({
          label: "Cancel",
          variant: "outline",
          icon: XCircle,
          onClick: handlers.onCancel,
        });
      }
      break;

    case "processing":
      if (canUpdate) {
        buttons.push({
          label: "Mark as Ready",
          icon: CheckCircle2,
          onClick: handlers.onReady,
        });
        buttons.push({
          label: "Cancel",
          variant: "outline",
          icon: XCircle,
          onClick: handlers.onCancel,
        });
      }
      break;

    case "ready":
      if (canUpdate) {
        buttons.push({
          label: "Complete Booking",
          icon: CheckCircle2,
          onClick: handlers.onComplete,
        });
      }
      break;

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
    "assigned",
    "pending",
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
      by: isCurrent ? "Admin" : "",
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
