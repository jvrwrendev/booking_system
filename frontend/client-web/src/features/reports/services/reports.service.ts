import { ApiError, request } from "@/lib/api-client";
import type {
  ReportExportFormat,
  ReportSection,
  ReportsBundleDto,
} from "@/types/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
  agentId?: string;
  status?: string;
  categoryId?: string;
}

function reportQuery(filters: ReportFilters = {}): Record<string, string | undefined> {
  return {
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    branchId:
      filters.branchId && filters.branchId !== "all"
        ? filters.branchId
        : undefined,
    agentId:
      filters.agentId && filters.agentId !== "all" ? filters.agentId : undefined,
    status:
      filters.status && filters.status !== "all"
        ? filters.status.toUpperCase()
        : undefined,
    categoryId:
      filters.categoryId && filters.categoryId !== "all"
        ? filters.categoryId
        : undefined,
  };
}

export function getReports(
  filters: ReportFilters = {},
): Promise<ReportsBundleDto> {
  return request<ReportsBundleDto>("/reports", {
    query: reportQuery(filters),
  });
}

function filenameFromHeader(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^"]+)"?/i.exec(header);
  return match?.[1] ?? fallback;
}

export async function downloadReport(
  filters: ReportFilters,
  format: ReportExportFormat,
  report: ReportSection,
): Promise<void> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(reportQuery(filters))) {
    if (value) query.set(key, value);
  }
  query.set("format", format);
  query.set("report", report);

  const response = await fetch(
    `${API_BASE}/reports/export?${query.toString()}`,
    { credentials: "include" },
  );

  if (!response.ok) {
    let message = `Export failed (HTTP ${response.status})`;
    try {
      const payload = (await response.json()) as {
        error?: { message?: string; code?: string };
      };
      message = payload.error?.message ?? message;
    } catch {
      // Keep the HTTP fallback when the response is not JSON.
    }
    throw new ApiError(
      response.status,
      "REPORT_EXPORT_FAILED",
      message,
    );
  }

  const blob = await response.blob();
  const fallback = `agrivet-report.${format === "excel" ? "xlsx" : format}`;
  const filename = filenameFromHeader(
    response.headers.get("Content-Disposition"),
    fallback,
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to start the download before revoking the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
