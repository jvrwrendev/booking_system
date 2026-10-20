import type { BookingStatus } from "@/types/booking";

export interface JourneyStep {
  key: BookingStatus;
  label: string;
  hint: string;
}

export const ORDER_JOURNEY: JourneyStep[] = [
  { key: "pending", label: "Pending", hint: "Booking submitted and awaiting approval" },
  { key: "accepted", label: "Accepted", hint: "Approved and ready to be assigned" },
  { key: "assigned", label: "Assigned to Admin", hint: "An admin has been assigned" },
  { key: "admin_accepted", label: "Admin Accepted", hint: "Accepted by the assigned admin" },
  { key: "processing", label: "Processing", hint: "Order is being prepared" },
  { key: "ready", label: "Ready for Pickup", hint: "Ready to be picked up" },
  { key: "completed", label: "Completed", hint: "Pickup was completed" },
  { key: "ready_for_delivery", label: "Ready for Delivery", hint: "Out for delivery / delivered" },
];

export function orderJourneyIndex(status: string): number {
  return ORDER_JOURNEY.findIndex((step) => step.key === status);
}

export function nextOrderStep(status: string): {
  status: BookingStatus;
  viaAssignment: boolean;
} | null {
  switch (status) {
    case "pending":
      return { status: "accepted", viaAssignment: false };
    case "accepted":
      return { status: "assigned", viaAssignment: true };
    case "assigned":
      return { status: "admin_accepted", viaAssignment: false };
    case "admin_accepted":
      return { status: "processing", viaAssignment: false };
    case "processing":
      return { status: "ready", viaAssignment: false };
    case "ready":
      return { status: "completed", viaAssignment: false };
    case "completed":
      return { status: "ready_for_delivery", viaAssignment: false };
    default:
      return null;
  }
}