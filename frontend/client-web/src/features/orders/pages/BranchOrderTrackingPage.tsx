import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { OrderTrackingView } from "@/features/orders/components/OrderTrackingView";
import { nextOrderStep } from "@/features/orders/lib/journey";
import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { mockUsers } from "@/data/mock-users";
import type { AuthUser } from "@/types/auth";
import type { BranchOrderStatus } from "@/types/branch-order";
import { humanize } from "@/lib/status";

export function BranchOrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { getOrder, setStatus, assignOrder } = useBranchOrdersStore();
  const { user } = useAuth();

  const order = id ? getOrder(id) : undefined;
  const next = order ? nextOrderStep(order.status) : null;

  const simulateNext = () => {
    if (!order) return;
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

  return (
    <OrderTrackingView
      order={
        order
          ? {
              id: order.id,
              reference: order.reference,
              status: order.status,
              statusHistory: order.statusHistory,
              createdAt: order.createdAt,
              assignmentDate: order.assignmentDate,
              assignedAdminId: order.assignedAdminId,
              assignedAdminName: order.assignedAdminName,
              assignedByName: order.assignedByName,
              totalAmount: order.totalAmount,
              items: order.items,
            }
          : undefined
      }
      noun="order"
      description={order?.branchName ?? ""}
      breadcrumbs={[
        { label: "Operations", href: "/orders" },
        { label: "Orders", href: "/orders" },
        { label: "Live Tracking" },
      ]}
      detailHref={order ? `/orders/branch/${order.id}` : "/orders"}
      notFound={{
        title: "Order not found",
        message: "The branch order you are trying to track does not exist.",
        backHref: "/orders",
        backLabel: "Back to orders",
      }}
      isTerminal={order?.status === "rejected"}
      summaryRows={[
        { label: "Branch", value: order?.branchName ?? "—" },
        { label: "Order date", value: order?.orderDate ?? "—" },
        ...(order?.notes ? [{ label: "Notes", value: order.notes }] : []),
      ]}
      onSimulateNext={simulateNext}
      nextStepLabel={next ? humanize(next.status) : null}
      isDone={!next || order?.status === "ready_for_delivery"}
    />
  );
}
