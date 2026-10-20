export type Role = "AGENT" | "BRANCH";

export const ROLE_LABELS: Record<Role, string> = {
  AGENT: "Agent",
  BRANCH: "Branch",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  AGENT:
    "Field agent who manages assigned customers and creates bookings on their behalf.",
  BRANCH:
    "Branch operator who orders inventory and monitors order progress.",
};
