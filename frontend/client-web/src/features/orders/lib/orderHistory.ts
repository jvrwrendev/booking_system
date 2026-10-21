import type { TimelineEvent } from "@/components/common/ActivityTimeline";
import { humanize } from "@/lib/status";
import { formatDateTime } from "@/lib/utils";
import type { Booking } from "@/types/booking";
import type { BranchOrder } from "@/types/branch-order";
import type { StatusHistoryEntry } from "@/types/order-history";

function fromHistory(
  history: StatusHistoryEntry[],
  activeId?: string
): TimelineEvent[] {
  return history.map((entry, idx) => ({
    id: entry.id,
    title: entry.label,
    description:
      entry.from !== entry.to
        ? `Status changed from ${humanize(entry.from)} to ${humanize(entry.to)}.`
        : undefined,
    timestamp: formatDateTime(entry.timestamp),
    by: entry.by,
    active:
      activeId !== undefined
        ? entry.id === activeId
        : idx === history.length - 1,
  }));
}

export function bookingTimeline(booking: Booking): TimelineEvent[] {
  const history = booking.statusHistory;
  if (history && history.length > 0) {
    const lastId = history[history.length - 1].id;
    return fromHistory(history, lastId);
  }

  const events: TimelineEvent[] = [
    {
      id: `${booking.id}-created`,
      title: "Order Created",
      description: `${booking.reference} was placed by the customer.`,
      timestamp: formatDateTime(booking.createdAt),
      by: booking.agentName ?? "System",
    },
  ];

  if (booking.assignmentDate || booking.assignedAdminName) {
    events.push({
      id: `${booking.id}-assigned`,
      title: `Assigned to ${booking.assignedAdminName ?? "Admin"}`,
      description: "Order was assigned to an admin for processing.",
      timestamp: booking.assignmentDate
        ? formatDateTime(booking.assignmentDate)
        : "",
      by: booking.assignedByName ?? "Super Admin",
      active: booking.status === "assigned",
    });
  }

  events.push({
    id: `${booking.id}-${booking.status}`,
    title: humanize(booking.status),
    description: `Order is currently ${humanize(booking.status).toLowerCase()}.`,
    timestamp: formatDateTime(booking.createdAt),
    by: booking.assignedAdminName ?? "System",
    active: true,
  });

  return events;
}

export function branchOrderTimeline(order: BranchOrder): TimelineEvent[] {
  const history = order.statusHistory;
  if (history && history.length > 0) {
    const lastId = history[history.length - 1].id;
    return fromHistory(history, lastId);
  }

  const events: TimelineEvent[] = [
    {
      id: `${order.id}-created`,
      title: "Order Created",
      description: `${order.reference} was submitted by ${order.branchName}.`,
      timestamp: formatDateTime(order.createdAt),
      by: order.branchName,
    },
  ];

  if (order.assignmentDate || order.assignedAdminName) {
    events.push({
      id: `${order.id}-assigned`,
      title: `Assigned to ${order.assignedAdminName ?? "Admin"}`,
      description: "Order was assigned to an admin for processing.",
      timestamp: order.assignmentDate
        ? formatDateTime(order.assignmentDate)
        : "",
      by: order.assignedByName ?? "Super Admin",
      active: order.status === "assigned",
    });
  }

  events.push({
    id: `${order.id}-${order.status}`,
    title: humanize(order.status),
    description: `Order is currently ${humanize(order.status).toLowerCase()}.`,
    timestamp: formatDateTime(order.createdAt),
    by: order.assignedAdminName ?? "System",
    active: true,
  });

  return events;
}