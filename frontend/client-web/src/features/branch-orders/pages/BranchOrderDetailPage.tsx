import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  History,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ShoppingCart,
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
  getBranchOrderStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import { useBranchOrdersStore } from "../hooks/useBranchOrdersStore";
import { AssignmentDialog } from "@/features/bookings/components/AssignmentDialog";
import { branchOrderTimeline } from "@/features/orders/lib/orderHistory";
import { mockBranches } from "@/data/mock-branches";
import { mockUsers } from "@/data/mock-users";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { BranchOrder, BranchOrderStatus } from "@/types/branch-order";

const TERMINAL_STATUSES = [
  "completed",
  "ready_for_delivery",
  "rejected",
] as BranchOrderStatus[];

export function BranchOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrder, setStatus, assignOrder, reassignOrder } =
    useBranchOrdersStore();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);

  const order = id ? getOrder(id) : undefined;

  if (!order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link to="/branch-orders">
            <ArrowLeft className="h-4 w-4" />
            Back to branch orders
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Branch order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const branch = mockBranches.find((b) => b.id === order.branchId);
  const timeline = branchOrderTimeline(order);
  const isTerminal = TERMINAL_STATUSES.includes(order.status);
  const canReview = isSuperAdmin && !isTerminal;

  const handleReject = () => {
    setStatus(order.id, "rejected", user ?? undefined);
    setRejectOpen(false);
  };

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canReview && order.status === "pending" && (
        <>
          <Button
            size="sm"
            onClick={() => setStatus(order.id, "accepted", user ?? undefined)}
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
      {canReview && order.status === "accepted" && !order.assignedAdminId && (
        <Button size="sm" onClick={() => setAssignmentOpen(true)}>
          <UserCheck className="h-4 w-4" />
          Assign to Admin
        </Button>
      )}
      {canReview && order.assignedAdminId && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAssignmentOpen(true)}
        >
          <RefreshCw className="h-4 w-4" />
          Re-assign
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
        onClick={() => navigate("/branch-orders")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to branch orders
      </Button>

      <PageHeader
        title={order.reference}
        description={`${order.branchName} · ${order.items.length} item(s)`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Branch Orders", href: "/branch-orders" },
          { label: order.reference },
        ]}
        actions={
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              variant={getBranchOrderStatusVariant(order.status)}
              label={humanize(order.status)}
            />
            {headerActions}
          </div>
        }
      />

      {order.assignedAdminName && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <UserCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            This order is assigned to{" "}
            <span className="font-medium text-foreground">
              {order.assignedAdminName}
            </span>
            . The assigned admin will process it from the Orders module.
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              Ordered Items
            </CardTitle>
            <div className="text-xs text-muted-foreground">
              {order.totalQuantity} units
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
                  {order.items.map((item, i) => (
                    <tr key={`${item.productName}-${i}`} className="border-t">
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
              <Row label="Subtotal" value={formatCurrency(order.subtotal)} />
              <Row
                label="Discounts"
                value={`-${formatCurrency(order.discount)}`}
              />
              <Separator />
              <Row
                label="Total Amount"
                value={formatCurrency(order.totalAmount)}
                highlight
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine
                icon={Building2}
                label={branch?.name ?? order.branchName}
              />
              <InfoLine icon={Phone} label={branch?.contactNumber ?? "—"} />
              <InfoLine icon={MapPin} label={branch?.address ?? "—"} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Order Information</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoLine
                icon={ShoppingCart}
                label={`Order No.: ${order.reference}`}
              />
              <InfoLine
                icon={CalendarDays}
                label={`Order Date: ${formatDate(order.orderDate)}`}
              />
              <InfoLine
                icon={UserCheck}
                label={
                  order.assignedAdminName
                    ? `Assigned Admin: ${order.assignedAdminName}`
                    : "Assigned Admin: —"
                }
              />
              {order.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Notes
                    </div>
                    <p className="mt-1 text-sm">{order.notes}</p>
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
            <SummaryLine label="Order No." value={order.reference} />
            <SummaryLine label="Status" value={humanize(order.status)} />
            <SummaryLine
              label="Assigned Admin"
              value={order.assignedAdminName ?? "—"}
            />
            <SummaryLine
              label="Created"
              value={formatDateTime(order.createdAt)}
            />
            <Separator />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject this order?"
        description={`This will reject order ${order.reference}. This action cannot be undone.`}
        confirmText="Reject"
        destructive
        onConfirm={handleReject}
      />

      {user && isSuperAdmin && (
        <AssignmentDialog
          open={assignmentOpen}
          onOpenChange={setAssignmentOpen}
          target={{
            reference: order.reference,
            details: order.branchName,
            assignedAdminId: order.assignedAdminId,
            assignedAdminName: order.assignedAdminName,
            assignedByName: order.assignedByName,
            assignmentDate: order.assignmentDate,
          }}
          admins={mockUsers}
          currentUser={user}
          onAssign={(admin, by) => {
            if (order.assignedAdminId) {
              reassignOrder(order.id, admin, by);
            } else {
              assignOrder(order.id, admin, by);
            }
          }}
        />
      )}
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