import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BadgePercent, CheckCircle2, History, RefreshCw, ShieldAlert, ShoppingCart, UserCheck, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DescriptionList, DetailRow } from "@/components/common/DescriptionList";
import { OrderItemsTable } from "@/components/common/OrderItemsTable";
import { NotFound } from "@/components/common/NotFound";

import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { AssignmentDialog } from "@/features/bookings/components/AssignmentDialog";
import { DiscountDialog } from "@/features/orders/components/DiscountDialog";
import { branchOrderTimeline } from "@/features/orders/lib/orderHistory";
import { mockBranches } from "@/data/mock-branches";
import { mockUsers } from "@/data/mock-users";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import type { BranchOrderStatus } from "@/types/branch-order";

const TERMINAL_STATUSES = [
  "completed",
  "ready_for_delivery",
  "rejected",
] as BranchOrderStatus[];

interface PendingAction {
  target: BranchOrderStatus;
  label: string;
}

const NEXT_ACTION: Record<
  string,
  { label: string; target: BranchOrderStatus; confirm?: boolean }
> = {
  assigned: { label: "Accept Order", target: "admin_accepted", confirm: true },
  admin_accepted: { label: "Process Order", target: "processing" },
  processing: { label: "Mark as Ready", target: "ready" },
  ready: { label: "Complete Order", target: "completed", confirm: true },
  completed: {
    label: "Ready for Delivery",
    target: "ready_for_delivery",
    confirm: true,
  },
};

const CONFIRM_COPY: Record<
  string,
  { title: string; description: (reference: string) => string }
> = {
  completed: {
    title: "Complete this order?",
    description: (ref) =>
      `This will complete order ${ref}. This action cannot be undone.`,
  },
  ready_for_delivery: {
    title: "Mark order ready for delivery?",
    description: (ref) =>
      `Order ${ref} will be marked as ready for delivery. This action cannot be undone.`,
  },
  admin_accepted: {
    title: "Accept this order?",
    description: (ref) =>
      `You are accepting order ${ref}. It will move to the accepted stage for processing.`,
  },
};

export interface BranchOrderDetailViewProps {
  /** Route the "back" affordance and breadcrumbs point at. */
  backHref: string;
  backLabel: string;
  /** Breadcrumb trail, excluding the final reference crumb. */
  breadcrumbs: { label: string; href?: string }[];
}

/**
 * The branch-order detail screen.
 *
 * Both `/orders/branch/:id` and `/branch-orders/:id` render this view — the
 * routes differ only in where the user came from.
 */
export function BranchOrderDetailView({
  backHref,
  backLabel,
  breadcrumbs,
}: BranchOrderDetailViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrder, setStatus, assignOrder, reassignOrder, applyDiscount } =
    useBranchOrdersStore();
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);

  const order = id ? getOrder(id) : undefined;

  if (!order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={backHref}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </Button>
        <NotFound
          title="Branch order not found"
          message="The branch order you are looking for does not exist."
          backHref={backHref}
          backLabel={backLabel}
        />
      </div>
    );
  }

  const branch = mockBranches.find((b) => b.id === order.branchId);
  const assignedUser = order.assignedAdminId
    ? mockUsers.find((u) => u.id === order.assignedAdminId)
    : undefined;
  const isAssignedToMe = !!user?.id && order.assignedAdminId === user.id;
  const canProcess = isAssignedToMe;
  const canEditDiscount =
    user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const nextAction = canProcess ? NEXT_ACTION[order.status] : undefined;
  const timeline = branchOrderTimeline(order);
  const isTerminal = TERMINAL_STATUSES.includes(order.status);

  const applyAction = () => {
    if (!pendingAction || !user) return;
    setStatus(order.id, pendingAction.target, user);
    setPendingAction(null);
  };

  const rejectOrder = () => {
    setStatus(order.id, "rejected", user ?? undefined);
    setRejectOpen(false);
  };

  const confirmCopy = pendingAction
    ? CONFIRM_COPY[pendingAction.target]
    : undefined;

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => navigate(backHref)}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Button>

      <PageHeader
        title={order.reference}
        description={`${order.branchName} · ${order.items.length} item(s)`}
        breadcrumbs={[
          ...breadcrumbs,
          { label: order.reference },
        ]}
        actions={
          <div className="flex flex-col items-end gap-2">
            <StatusBadge
              variant={getStatusVariant(order.status)}
              label={humanize(order.status)}
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {isSuperAdmin && order.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      setStatus(order.id, "accepted", user ?? undefined)
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setRejectOpen(true)}
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                    Reject
                  </Button>
                </>
              )}
              {isSuperAdmin &&
                order.status === "accepted" &&
                !order.assignedAdminId && (
                  <Button size="sm" onClick={() => setAssignmentOpen(true)}>
                    <UserCheck className="h-4 w-4" aria-hidden />
                    Assign to Admin
                  </Button>
                )}
              {isSuperAdmin && order.assignedAdminId && !isTerminal && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAssignmentOpen(true)}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Re-assign
                </Button>
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
                          setStatus(
                            order.id,
                            nextAction.target,
                            user ?? undefined
                          )
                  }
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  {nextAction.label}
                </Button>
              )}
            </div>
          </div>
        }
      />

      {order.assignedAdminId && !isAssignedToMe && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            This order is assigned to{" "}
            <span className="font-medium text-foreground">
              {order.assignedAdminName}
            </span>
            . You can view its details but cannot process it.
          </div>
        </div>
      )}

      {isSuperAdmin && isTerminal && (
        <div className="flex items-start gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            This order is{" "}
            <span className="font-medium text-foreground">
              {humanize(order.status).toLowerCase()}
            </span>{" "}
            and no further action is available.
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden />
              Ordered Items
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {order.totalQuantity} units
              </span>
              {canEditDiscount &&
                !["ready_for_delivery", "rejected"].includes(order.status) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDiscountOpen(true)}
                  >
                    <BadgePercent className="h-4 w-4" aria-hidden />
                    {order.discount > 0 ? "Edit discount" : "Add discount"}
                  </Button>
                )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <OrderItemsTable
              items={order.items.map((item, i) => ({
                key: `${item.productName}-${i}`,
                productName: item.productName,
                sku: item.sku,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.subtotal,
              }))}
            />
            <Separator />
            <div className="ml-auto max-w-xs space-y-2">
              <DetailRow label="Subtotal" value={formatCurrency(order.subtotal)} />
              <DetailRow
                label="Discounts"
                value={`-${formatCurrency(order.discount)}`}
              />
              <Separator />
              <DetailRow
                label="Total Amount"
                value={formatCurrency(order.totalAmount)}
                emphasis
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branch Information</CardTitle>
            </CardHeader>
            <CardContent>
              <DescriptionList
                columns={1}
                items={[
                  { label: "Branch", value: branch?.name ?? order.branchName },
                  { label: "Contact", value: branch?.contactNumber ?? "—" },
                  { label: "Address", value: branch?.address ?? "—" },
                ]}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Order Information</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" aria-hidden />
            </CardHeader>
            <CardContent className="space-y-4">
              <DescriptionList
                columns={1}
                items={[
                  { label: "Order no.", value: order.reference },
                  { label: "Order date", value: formatDate(order.orderDate) },
                  {
                    label: "Assigned admin",
                    value: order.assignedAdminName
                      ? `${order.assignedAdminName}${
                          assignedUser?.role === "SUPER_ADMIN"
                            ? " (Super Admin)"
                            : ""
                        }`
                      : "—",
                  },
                  ...(order.notes ? [{ label: "Notes", value: order.notes }] : []),
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimeline events={timeline} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Order Summary</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Order no." value={order.reference} />
            <DetailRow label="Status" value={humanize(order.status)} />
            <DetailRow
              label="Assigned admin"
              value={order.assignedAdminName ?? "—"}
            />
            <DetailRow
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
        onConfirm={rejectOrder}
      />

      <ConfirmDialog
        open={pendingAction !== null}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title={confirmCopy?.title ?? "Confirm action?"}
        description={
          confirmCopy
            ? confirmCopy.description(order.reference)
            : "This action cannot be undone."
        }
        confirmText={pendingAction?.label ?? "Confirm"}
        onConfirm={applyAction}
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

      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        subtotal={order.subtotal}
        currentDiscount={order.discount ?? 0}
        onSave={(discount, note) =>
          applyDiscount(order.id, discount, user ?? undefined, note)
        }
      />
    </div>
  );
}
