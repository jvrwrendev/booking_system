const STATUS_ACTIONS: Record<string, string> = {
  PENDING: "created the order",
  ACCEPTED: "accepted",
  ASSIGNED: "assigned the order",
  ADMIN_ACCEPTED: "accepted the assigned order",
  REVIEW_ORDER: "reviewed the order",
  CONFIRMED: "confirmed the order",
  PROCESSING: "started processing",
  READY: "marked the order ready",
  READY_FOR_DELIVERY: "marked the order ready for delivery",
  COMPLETED: "completed the order",
  CANCELLED: "cancelled the order",
  REJECTED: "rejected the order",
};

const LEGACY_ACTIONS: Record<string, string> = {
  pending: "created the order",
  accepted: "accepted",
  assigned: "assigned the order",
  "admin accepted": "accepted the assigned order",
  "review order": "reviewed the order",
  "reviewed order": "reviewed the order",
  confirmed: "confirmed the order",
  processing: "started processing",
  ready: "marked the order ready",
  "ready for delivery": "marked the order ready for delivery",
  completed: "completed the order",
  cancelled: "cancelled the order",
  rejected: "rejected the order",
};

export interface HistoryLabelInput {
  label: string;
  byName: string | null;
  toStatus: string;
}

function displayName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed || "System";
}

export function statusActionLabel(status: string, actorName: string): string {
  const action =
    STATUS_ACTIONS[status] ??
    `changed the status to ${status.replaceAll("_", " ").toLowerCase()}`;
  return `${displayName(actorName)} ${action}`;
}

export function createdActionLabel(actorName: string): string {
  return `${displayName(actorName)} created the order`;
}

export function updatedActionLabel(actorName: string): string {
  return `${displayName(actorName)} updated the order details`;
}

export function unassignedActionLabel(actorName: string): string {
  return `${displayName(actorName)} unassigned the order`;
}

export function assignmentActionLabel(
  actorName: string,
  adminName: string,
  isReassign: boolean,
): string {
  return `${displayName(actorName)} ${
    isReassign ? "reassigned" : "assigned"
  } the order to ${displayName(adminName)}`;
}

export function discountActionLabel(
  actorName: string,
  discount: number,
): string {
  return discount === 0
    ? `${displayName(actorName)} removed the discount`
    : `${displayName(actorName)} applied a discount of ${discount}`;
}

export function withHistoryNote(
  label: string,
  note: string | null | undefined,
): string {
  const trimmed = note?.trim();
  return trimmed ? `${label} — ${trimmed}` : label;
}

/**
 * Formats both new and legacy history rows so the person responsible for the
 * change is always visible. The transformation is idempotent because labels
 * that already start with the actor's name are returned unchanged.
 */
export function historyLabel({
  label,
  byName,
  toStatus,
}: HistoryLabelInput): string {
  const actor = displayName(byName);
  const trimmed = label.trim();
  if (!trimmed) {
    const action = STATUS_ACTIONS[toStatus];
    return action ? `${actor} ${action}` : actor;
  }
  if (trimmed === actor || trimmed.startsWith(`${actor} `)) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  switch (normalized) {
    case "order created":
      return `${actor} created the order`;
    case "order details updated":
      return `${actor} updated the order details`;
    case "unassigned":
      return `${actor} unassigned the order`;
    case "discount removed":
      return `${actor} removed the discount`;
  }

  const assignment = /^(re)?assigned to (.+)$/i.exec(trimmed);
  if (assignment) {
    return `${actor} ${
      assignment[1] ? "reassigned" : "assigned"
    } the order to ${assignment[2]}`;
  }

  const discount = /^discount applied:\s*(.+)$/i.exec(trimmed);
  if (discount) {
    return `${actor} applied a discount of ${discount[1]}`;
  }

  const legacyAction = LEGACY_ACTIONS[normalized];
  if (legacyAction) {
    return `${actor} ${legacyAction}`;
  }

  return `${actor} — ${trimmed}`;
}
