export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  timestamp: string;
}

export type AuditModule =
  | "Authentication"
  | "Products"
  | "Categories"
  | "Inventory"
  | "Bookings"
  | "Customers"
  | "Agents"
  | "Branches"
  | "Users"
  | "Settings"
  | "Reports";

export type AuditAction =
  | "Create"
  | "Update"
  | "Delete"
  | "Login"
  | "Logout"
  | "Approve"
  | "Reject"
  | "Cancel"
  | "View"
  | "Export";