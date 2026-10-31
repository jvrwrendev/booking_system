import { z } from "zod";

const BOOKING_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "ASSIGNED",
  "ADMIN_ACCEPTED",
  "REVIEW_ORDER",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "READY_FOR_DELIVERY",
  "CANCELLED",
  "REJECTED",
] as const;

export const reportsQueryDto = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  branchId: z.string().trim().max(100).optional(),
  agentId: z.string().trim().max(100).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  categoryId: z.string().trim().max(100).optional(),
});

export const reportExportQueryDto = reportsQueryDto.extend({
  format: z.enum(["csv", "excel", "pdf"]).default("csv"),
  report: z
    .enum(["all", "bookings", "inventory", "branches", "agents"])
    .default("all"),
});

export type ReportsQueryDto = z.infer<typeof reportsQueryDto>;
export type ReportExportQueryDto = z.infer<typeof reportExportQueryDto>;
