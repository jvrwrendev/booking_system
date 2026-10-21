import { useParams } from "react-router-dom";
import { toast } from "sonner";

import { OrderTrackingView } from "@/features/orders/components/OrderTrackingView";
import { nextOrderStep } from "@/features/orders/lib/journey";
import { useBookingsStore } from "../hooks/useBookingsStore";
import { useAuth } from "@/hooks/useAuth";
import { mockUsers } from "@/data/mock-users";
import type { AuthUser } from "@/types/auth";
import { humanize } from "@/lib/status";

export function BookingTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { getBooking, setStatus, assignBooking } = useBookingsStore();
  const { user } = useAuth();

  const booking = id ? getBooking(id) : undefined;
  const next = booking ? nextOrderStep(booking.status) : null;

  const simulateNext = () => {
    if (!booking) return;
    const step = nextOrderStep(booking.status);
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

  return (
    <OrderTrackingView
      order={
        booking
          ? {
              id: booking.id,
              reference: booking.reference,
              status: booking.status,
              statusHistory: booking.statusHistory,
              createdAt: booking.createdAt,
              assignmentDate: booking.assignmentDate,
              assignedAdminId: booking.assignedAdminId,
              assignedAdminName: booking.assignedAdminName,
              assignedByName: booking.assignedByName,
              totalAmount: booking.totalAmount,
              items: booking.items,
            }
          : undefined
      }
      noun="booking"
      description={`${booking?.customerName ?? ""} · ${booking?.branchName ?? ""}`}
      breadcrumbs={[
        { label: "Operations", href: "/bookings" },
        { label: "Bookings", href: "/bookings" },
        { label: "Live Tracking" },
      ]}
      detailHref={booking ? `/bookings/${booking.id}` : "/bookings"}
      notFound={{
        title: "Booking not found",
        message: "The booking you are trying to track does not exist.",
        backHref: "/bookings",
        backLabel: "Back to bookings",
      }}
      isTerminal={
        !!booking && ["cancelled", "rejected"].includes(booking.status)
      }
      summaryRows={[
        {
          label: "Customer",
          value: booking?.customerName ?? "—",
        },
        { label: "Agent", value: booking?.agentName ?? "—" },
        { label: "Branch", value: booking?.branchName ?? "—" },
        { label: "Pickup", value: booking?.pickupDate ?? "—" },
      ]}
      onSimulateNext={simulateNext}
      nextStepLabel={next ? humanize(next.status) : null}
      isDone={!next || booking?.status === "ready_for_delivery"}
    />
  );
}
