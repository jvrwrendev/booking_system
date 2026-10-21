import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgePercent, CalendarDays, CheckCircle2, History, Mail, MapPin, Phone, ShieldAlert, Truck, User, UserCheck, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { OrderItemsTable } from "@/components/common/OrderItemsTable";
import { DetailRow } from "@/components/common/DescriptionList";
import { NotFound } from "@/components/common/NotFound";

import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { AssignmentDialog } from "@/features/bookings/components/AssignmentDialog";
import { DiscountDialog } from "../components/DiscountDialog";
import { bookingTimeline } from "../lib/orderHistory";
import { mockCustomers } from "@/data/mock-customers";
import { mockAgents } from "@/data/mock-agents";
import { mockUsers } from "@/data/mock-users";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { BookingStatus } from "@/types/booking";

const TERMINAL_STATUSES = [
  "completed",
  "ready_for_delivery",
  "cancelled",
  "rejected",
] as BookingStatus[];

interface PendingAction {
  target: BookingStatus;
  label: string;
}

const NEXT_ACTION: Record<
  string,
  { label: string; target: BookingStatus; confirm?: boolean }
> = {
  assigned: { label: "Accept Order", target: "admin_accepted", confirm: true },
  admin_accepted: { label: "Process Order", target: "processing" },
  confirmed: { label: "Process Order", target: "processing" },
  processing: { label: "Mark as Ready", target: "ready" },
  ready: { label: "Complete Order", target: "completed", confirm: true },
  completed: {
    label: "Ready for Delivery",
    target: "ready_for_delivery",
    confirm: true,
  },
};

export function AgentOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBooking, setStatus, assignBooking, reassignBooking, applyDiscount } =
    useBookingsStore();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const canEditDiscount =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const booking = id ? getBooking(id) : undefined;

  if (!booking) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        <NotFound
          title="Agent order not found"
          message="The agent order you are looking for does not exist."
          backHref="/orders"
          backLabel="Back to orders"
        />
      </div>
    );
  }

  const customer = mockCustomers.find((c) => c.id === booking.customerId);
  const agent = mockAgents.find((a) => a.id === booking.agentId);
  const assignedUser = booking.assignedAdminId
    ? mockUsers.find((u) => u.id === booking.assignedAdminId)
    : undefined;
  const isAssignedToMe = !!user?.id && booking.assignedAdminId === user.id;
  const canProcess = isAssignedToMe;
  const nextAction = canProcess ? NEXT_ACTION[booking.status] : undefined;
  const timeline = bookingTimeline(booking);
  const isTerminal = TERMINAL_STATUSES.includes(booking.status);

  const applyAction = () => {
    if (!pendingAction || !user) return;
    setStatus(booking.id, pendingAction.target, user);
    setPendingAction(null);
  };

  const rejectOrder = () => {
    setStatus(booking.id, "rejected", user ?? undefined);
    setRejectOpen(false);
  };

  const confirmTitle = (() => {
    switch (pendingAction?.target) {
      case "completed":
        return "Complete this order?";
      case "ready_for_delivery":
        return "Mark order ready for delivery?";
      case "admin_accepted":
        return "Accept this order?";
      case "rejected":
        return "Reject this order?";
      default:
        return "Confirm action?";
    }
  })();

  const confirmDescription = (() => {
    switch (pendingAction?.target) {
      case "completed":
        return `This will complete order ${booking.reference}. This action cannot be undone.`;
      case "ready_for_delivery":
        return `Order ${booking.reference} will be marked as ready for delivery. This action cannot be undone.`;
      case "admin_accepted":
        return `You are accepting order ${booking.reference}. It will move to the accepted stage for processing.`;
      case "rejected":
        return `This will reject order ${booking.reference}. This action cannot be undone.`;
      default:
        return "";
    }
  })();

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/orders")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </Button>

      <PageHeader
        title={booking.reference}
        description={`${booking.customerName} · ${booking.items.length} item(s)`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Orders", href: "/orders" },
          { label: "Agent Orders" },
          { label: booking.reference },
        ]}
        actions={
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              variant={getStatusVariant(booking.status)}
              label={humanize(booking.status)}
            />
            {isSuperAdmin && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {booking.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() =>
                        setStatus(booking.id, "accepted", user ?? undefined)
                      }
                    >
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
                {booking.status === "accepted" && !booking.assignedAdminId && (
                  <Button size="sm" onClick={() => setAssignmentOpen(true)}>
                    <UserCheck className="h-4 w-4" />
                    Assign to Admin
                  </Button>
                )}
              </div>
            )}
            {nextAction && (
              <Button
                size="sm"
                onClick={
                  nextAction.confirm
                    ? () =>
                        setPendingAction({
                          target: nextAction.target,
                          label: nextAction.label,
                        })
                    : () =>
                        setStatus(booking.id, nextAction.target, user ?? undefined)
                }
              >
                <CheckCircle2 className="h-4 w-4" />
                {nextAction.label}
              </Button>
            )}
          </div>
        }
      />

      {booking.assignedAdminId && !isAssignedToMe && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            This order is assigned to{" "}
            <span className="font-medium text-foreground">
              {booking.assignedAdminName}
            </span>
            . You can view its details but cannot process it.
          </div>
        </div>
      )}

      {isSuperAdmin && isTerminal && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            This order is{" "}
            <span className="font-medium text-foreground">
              {humanize(booking.status).toLowerCase()}
            </span>{" "}
            and no further action is available.
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Ordered Items</CardTitle>
            <div className="flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                {booking.totalQuantity} units
              </div>
              {canEditDiscount &&
                !["ready_for_delivery", "cancelled", "rejected"].includes(
                  booking.status
                ) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDiscountOpen(true)}
                >
                  <BadgePercent className="h-4 w-4" />
                  {booking.discount > 0 ? "Edit discount" : "Add discount"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <OrderItemsTable
              items={booking.items.map((item) => ({
                key: item.productId,
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
                label="Total amount"
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
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine
                icon={CalendarDays}
                label={`Order Date: ${formatDate(booking.bookingDate)}`}
              />
              <InfoLine
                icon={Truck}
                label={`Pickup: ${formatDate(booking.pickupDate)}`}
              />
              <InfoLine
                icon={UserCheck}
                label={
                  booking.assignedAdminName
                    ? `Assigned ${
                        assignedUser?.role === "SUPER_ADMIN"
                          ? "to Super Admin"
                          : "Admin"
                      }: ${booking.assignedAdminName}`
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
            <CardTitle>Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline events={timeline} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Order Summary</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryLine label="Order No." value={booking.reference} />
            <SummaryLine label="Status" value={humanize(booking.status)} />
            <SummaryLine
              label="Assigned Admin"
              value={
                booking.assignedAdminName
                  ? assignedUser?.role === "SUPER_ADMIN"
                  ? `${booking.assignedAdminName} (Super Admin)`
                    : booking.assignedAdminName
                  : "—"
              }
            />
            <SummaryLine
              label="Created"
              value={formatDateTime(booking.createdAt)}
            />
            <Separator />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject this order?"
        description={`This will reject order ${booking.reference}. This action cannot be undone.`}
        confirmText="Reject"
        destructive
        onConfirm={rejectOrder}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title={confirmTitle}
        description={confirmDescription}
        confirmText={pendingAction?.label ?? "Confirm"}
        onConfirm={applyAction}
      />

      {user && isSuperAdmin && (
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

      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        subtotal={booking.subtotal}
        currentDiscount={booking.discount ?? 0}
        onSave={(discount, note) =>
          applyDiscount(booking.id, discount, user ?? undefined, note)
        }
      />
    </div>
  );
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
      <span className="break-words">{label}</span>
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