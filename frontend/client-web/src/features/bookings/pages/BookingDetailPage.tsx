import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Package,
  Phone,
  Truck,
  User,
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

import { useBookingsStore } from "../hooks/useBookingsStore";
import { mockCustomers } from "@/data/mock-customers";
import { mockAgents } from "@/data/mock-agents";
import { mockBranches } from "@/data/mock-branches";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import type { BookingStatus } from "@/types/booking";

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBooking, setStatus } = useBookingsStore();
  const { can } = usePermissions();

  const booking = id ? getBooking(id) : undefined;

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
          <StatusBadge
            variant={getBookingStatusVariant(booking.status)}
            label={humanize(booking.status)}
          />
        }
      />

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
              <InfoLine icon={User} label={customer?.fullName ?? booking.customerName} />
              <InfoLine icon={Phone} label={customer?.contactNumber ?? "—"} />
              <InfoLine icon={Mail} label={customer?.email ?? "—"} />
              <InfoLine icon={MapPin} label={customer?.address ?? "—"} />
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
              <InfoLine icon={User} label={`Agent: ${agent?.fullName ?? booking.agentName}`} />
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
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {canApprove && booking.status === "pending" && (
              <>
                <Button
                  className="w-full"
                  onClick={() => setStatus(booking.id, "confirmed")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirm booking
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStatus(booking.id, "rejected")}
                >
                  <XCircle className="h-4 w-4" />
                  Reject booking
                </Button>
              </>
            )}
            {canUpdate && booking.status === "confirmed" && (
              <Button
                className="w-full"
                onClick={() => setStatus(booking.id, "processing")}
              >
                Mark as processing
              </Button>
            )}
            {canUpdate && booking.status === "processing" && (
              <Button
                className="w-full"
                onClick={() => setStatus(booking.id, "ready")}
              >
                Mark as ready
              </Button>
            )}
            {canUpdate && booking.status === "ready" && (
              <Button
                className="w-full"
                onClick={() => setStatus(booking.id, "completed")}
              >
                Complete booking
              </Button>
            )}
            {canUpdate &&
              !["completed", "cancelled", "rejected"].includes(booking.status) && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setStatus(booking.id, "cancelled")}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel booking
                </Button>
              )}
            {["completed", "cancelled", "rejected"].includes(booking.status) && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                This booking is closed ({humanize(booking.status)}). No further
                actions are available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function buildTimeline(booking: { id: string; reference: string; status: BookingStatus; createdAt: string }) {
  const sequence: BookingStatus[] = [
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