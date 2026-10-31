import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { OrderTrackingView } from "@/features/orders/components/OrderTrackingView";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingsStore } from "../hooks/useBookingsStore";

export function BookingTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { getBooking, loadBooking, loading, error } = useBookingsStore();

  const booking = id ? getBooking(id) : undefined;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadBooking]);

  if (!booking) {
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
      );
    }
  }

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
    />
  );
}
