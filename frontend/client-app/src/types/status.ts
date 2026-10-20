export type TransactionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "REJECTED";

export const TRANSACTION_STATUS_FLOW: TransactionStatus[] = [
  "PENDING",
  "ACCEPTED",
  "ASSIGNED",
  "PROCESSING",
  "READY",
  "COMPLETED",
];

export const TERMINAL_TRANSACTION_STATUSES: TransactionStatus[] = [
  "COMPLETED",
  "REJECTED",
];

export function isTransactionTerminal(status: TransactionStatus): boolean {
  return TERMINAL_TRANSACTION_STATUSES.includes(status);
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ASSIGNED: "Assigned",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export function humanizeStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
