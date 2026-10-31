import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { OrderTrackingView } from "@/features/orders/components/OrderTrackingView";
import { nextOrderStep } from "@/features/orders/lib/journey";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { useBookingLookups } from "@/features/bookings/hooks/useBookingLookups";
import { useAuth } from "@/hooks/useAuth";
import type { AuthUser } from "@/types/auth";
import type { BranchOrderStatus } from "@/types/branch-order";
import { humanize } from "@/lib/status";

export function BranchOrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { getOrder, loadOrder, loading, error, setStatus, assignOrder } =
    useBranchOrdersStore();
  const { user } = useAuth();
  const { admins } = useBookingLookups(true);

  const order = id ? getOrder(id) : undefined;
  const next = order ? nextOrderStep(order.status) : null;
  const [loadAttempted, setLoadAttempted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || getOrder(id)) {
      setLoadAttempted(true);
      return;
    }
    let cancelled = false;
    setLoadError(null);
    void loadOrder(id)
      .then((result) => {
        if (!cancelled && !result) {
          setLoadError("Could not load branch order. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadAttempted(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadOrder]);

  if (!order) {
    if (loading || !loadAttempted) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[420px] w-full" />
        </div>
      );
    }
    const displayError = loadError ?? error;
    if (displayError) {
      return (
        <ErrorState
          title="Could not load branch order"
          message={displayError}
          onRetry={() => {
            setLoadError(null);
            setLoadAttempted(false);
            if (id) {
              void loadOrder(id)
                .then((result) => {
                  if (!result) {
                    setLoadError(
                      "Could not load branch order. Please try again.",
                    );
                  }
                })
                .finally(() => setLoadAttempted(true));
            }
          }}
        />
      );
    }
  }

  const simulateNext = async () => {
    if (!order) return;
    const step = nextOrderStep(order.status);
    if (!step) return;
    const actor: Pick<AuthUser, "id" | "fullName"> = user ?? {
      id: "USR-001",
      fullName: "System",
    };
    if (step.viaAssignment) {
      const admin = admins.find(
        (candidate) =>
          (candidate.role === "ADMIN" || candidate.role === "SUPER_ADMIN") &&
          candidate.status === "active",
      );
      if (admin) {
        await assignOrder(
          order.id,
          { id: admin.id, fullName: admin.fullName },
          actor,
        );
      } else {
        toast.error("No active admin available to assign.");
      }
      return;
    }
    await setStatus(order.id, step.status as BranchOrderStatus, actor);
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
      isTerminal={
        order?.status === "rejected" || order?.status === "completed"
      }
      summaryRows={[
        { label: "Branch", value: order?.branchName ?? "—" },
        { label: "Order date", value: order?.orderDate ?? "—" },
        ...(order?.notes ? [{ label: "Notes", value: order.notes }] : []),
      ]}
      onSimulateNext={() => void simulateNext()}
      nextStepLabel={next ? humanize(next.status) : null}
      isDone={!next || order?.status === "completed"}
    />
  );
}
