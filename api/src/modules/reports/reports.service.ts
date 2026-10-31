import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { Prisma } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  ReportExportQueryDto,
  ReportsQueryDto,
} from "./dto/index.js";

export interface ReportsBundle {
  generatedAt: Date;
  filters: {
    dateFrom: Date;
    dateTo: Date;
    branchId: string | null;
    agentId: string | null;
    status: string | null;
    categoryId: string | null;
  };
  summary: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    uniqueCustomers: number;
  };
  bookingVolumeMonthly: { month: string; count: number }[];
  bookingRevenueMonthly: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  inventoryByCategory: { category: string; value: number }[];
  branchPerformance: {
    branch: string;
    bookings: number;
    completed: number;
    revenue: number;
  }[];
  agentPerformance: {
    agent: string;
    bookings: number;
    completed: number;
    revenue: number;
  }[];
  lowStockProducts: {
    name: string;
    sku: string;
    stock: number;
    minimum: number;
  }[];
}

export interface ReportExport {
  filename: string;
  contentType: string;
  body: string | Buffer;
}

/**
 * Revenue is recognised only once a booking has been completed (including
 * the final ready-for-delivery state). Pending and in-progress bookings are
 * still counted in volume and status tables, but not in monetary totals.
 */
const REVENUE_STATUSES = new Set(["COMPLETED", "READY_FOR_DELIVERY"]);

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  ASSIGNED: "Assigned",
  ADMIN_ACCEPTED: "Admin accepted",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  READY_FOR_DELIVERY: "Ready for delivery",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

function endOfDay(date: Date): Date {
  const result = new Date(date);
  if (
    result.getUTCHours() === 0 &&
    result.getUTCMinutes() === 0 &&
    result.getUTCSeconds() === 0 &&
    result.getUTCMilliseconds() === 0
  ) {
    result.setUTCHours(23, 59, 59, 999);
  }
  return result;
}

function resolveRange(query: ReportsQueryDto): { dateFrom: Date; dateTo: Date } {
  const now = new Date();
  const defaultFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 8, 1),
  );
  const dateFrom = query.dateFrom ?? defaultFrom;
  const dateTo = query.dateTo ? endOfDay(query.dateTo) : now;

  if (dateFrom > dateTo) {
    throw Errors.badRequest("The start date must be before the end date");
  }
  return { dateFrom, dateTo };
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string, includeYear: boolean): string {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, 1));
  const label = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  return includeYear ? `${label} ${String(year).slice(-2)}` : label;
}

function buildMonthKeys(dateFrom: Date, dateTo: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(
    Date.UTC(dateFrom.getUTCFullYear(), dateFrom.getUTCMonth(), 1),
  );
  const end = new Date(Date.UTC(dateTo.getUTCFullYear(), dateTo.getUTCMonth(), 1));

  while (cursor <= end) {
    keys.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return keys;
}

function humanizeStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

function sumRevenue(
  bookings: { status: string; totalAmount: number }[],
): number {
  return bookings.reduce(
    (sum, booking) =>
      REVENUE_STATUSES.has(booking.status)
        ? sum + booking.totalAmount
        : sum,
    0,
  );
}

export async function generateReports(
  query: ReportsQueryDto,
): Promise<ReportsBundle> {
  const { dateFrom, dateTo } = resolveRange(query);

  const bookingWhere: Prisma.BookingWhereInput = {
    bookingDate: { gte: dateFrom, lte: dateTo },
    ...(query.branchId ? { branchId: query.branchId } : {}),
    ...(query.agentId ? { agentId: query.agentId } : {}),
    ...(query.status ? { status: query.status } : {}),
  };

  const bookings = await prisma.booking.findMany({
    where: bookingWhere,
    select: {
      customerId: true,
      customerName: true,
      status: true,
      totalAmount: true,
      bookingDate: true,
      branchId: true,
      branchName: true,
      agentId: true,
      agentName: true,
    },
  });

  const normalizedBookings = bookings.map((booking) => ({
    customerId: booking.customerId,
    customerName: booking.customerName,
    status: booking.status,
    totalAmount: Number(booking.totalAmount),
    bookingDate: booking.bookingDate,
    branchId: booking.branchId,
    branchName: booking.branchName,
    agentId: booking.agentId,
    agentName: booking.agentName,
  }));

  const uniqueCustomerKeys = new Set(
    normalizedBookings.map(
      (booking) =>
        booking.customerId ?? `name:${booking.customerName.trim().toLowerCase()}`,
    ),
  );

  const monthKeys = buildMonthKeys(dateFrom, dateTo);
  const monthCounts = new Map<string, number>();
  const monthRevenue = new Map<string, number>();
  for (const key of monthKeys) {
    monthCounts.set(key, 0);
    monthRevenue.set(key, 0);
  }

  for (const booking of normalizedBookings) {
    const key = monthKey(booking.bookingDate);
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    if (REVENUE_STATUSES.has(booking.status)) {
      monthRevenue.set(key, (monthRevenue.get(key) ?? 0) + booking.totalAmount);
    }
  }

  const includeYear = monthKeys.length > 12;
  const statusCounts = new Map<string, number>();
  for (const booking of normalizedBookings) {
    statusCounts.set(
      booking.status,
      (statusCounts.get(booking.status) ?? 0) + 1,
    );
  }

  const branchCounts = new Map<
    string,
    { branch: string; bookings: number; completed: number; revenue: number }
  >();
  const agentCounts = new Map<
    string,
    { agent: string; bookings: number; completed: number; revenue: number }
  >();

  for (const booking of normalizedBookings) {
    const branch = branchCounts.get(booking.branchId) ?? {
      branch: booking.branchName,
      bookings: 0,
      completed: 0,
      revenue: 0,
    };
    branch.bookings += 1;
    if (REVENUE_STATUSES.has(booking.status)) {
      branch.completed += 1;
      branch.revenue += booking.totalAmount;
    }
    branchCounts.set(booking.branchId, branch);

    const agentKey = booking.agentId ?? booking.agentName;
    const agent = agentCounts.get(agentKey) ?? {
      agent: booking.agentName,
      bookings: 0,
      completed: 0,
      revenue: 0,
    };
    agent.bookings += 1;
    if (REVENUE_STATUSES.has(booking.status)) {
      agent.completed += 1;
      agent.revenue += booking.totalAmount;
    }
    agentCounts.set(agentKey, agent);
  }

  const inventoryRows = await prisma.inventoryStock.findMany({
    where: {
      ...(query.branchId ? { branchId: query.branchId } : {}),
      product: {
        status: { not: "INACTIVE" },
        ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      },
    },
    select: {
      productId: true,
      currentStock: true,
      minimumStock: true,
      product: {
        select: {
          name: true,
          sku: true,
          costPrice: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  const categoryValues = new Map<string, number>();
  for (const row of inventoryRows) {
    const category = row.product.category?.name ?? "Uncategorized";
    const value = row.currentStock * Number(row.product.costPrice);
    categoryValues.set(category, (categoryValues.get(category) ?? 0) + value);
  }

  const productTotals = new Map<
    string,
    { name: string; sku: string; stock: number; minimum: number }
  >();
  for (const row of inventoryRows) {
    const current = productTotals.get(row.productId) ?? {
      name: row.product.name,
      sku: row.product.sku,
      stock: 0,
      minimum: 0,
    };
    current.stock += row.currentStock;
    current.minimum += row.minimumStock;
    productTotals.set(row.productId, current);
  }

  const lowStockMap = new Map(
    [...productTotals.entries()].filter(
      ([, product]) =>
        product.minimum > 0 && product.stock <= product.minimum,
    ),
  );

  return {
    generatedAt: new Date(),
    filters: {
      dateFrom,
      dateTo,
      branchId: query.branchId ?? null,
      agentId: query.agentId ?? null,
      status: query.status ?? null,
      categoryId: query.categoryId ?? null,
    },
    summary: {
      totalBookings: normalizedBookings.length,
      completedBookings: normalizedBookings.filter((booking) =>
        REVENUE_STATUSES.has(booking.status),
      ).length,
      pendingBookings: normalizedBookings.filter(
        (booking) => booking.status === "PENDING",
      ).length,
      totalRevenue: sumRevenue(normalizedBookings),
      uniqueCustomers: uniqueCustomerKeys.size,
    },
    bookingVolumeMonthly: monthKeys.map((key) => ({
      month: monthLabel(key, includeYear),
      count: monthCounts.get(key) ?? 0,
    })),
    bookingRevenueMonthly: monthKeys.map((key) => ({
      month: monthLabel(key, includeYear),
      revenue: monthRevenue.get(key) ?? 0,
    })),
    bookingsByStatus: [...statusCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([status, count]) => ({
        status: humanizeStatus(status),
        count,
      })),
    inventoryByCategory: [...categoryValues.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([category, value]) => ({ category, value })),
    branchPerformance: [...branchCounts.values()].sort(
      (a, b) => b.revenue - a.revenue,
    ),
    agentPerformance: [...agentCounts.values()].sort(
      (a, b) => b.revenue - a.revenue,
    ),
    lowStockProducts: [...lowStockMap.values()].sort(
      (a, b) => a.stock - b.stock,
    ),
  };
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvSection(
  title: string,
  headers: string[],
  rows: (string | number)[][],
): string {
  return [
    title,
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
    "",
  ].join("\n");
}

function buildCsv(data: ReportsBundle, report: string): string {
  const sections: string[] = [];
  const include = (name: string) => report === "all" || report === name;

  if (include("bookings")) {
    sections.push(
      csvSection(
        "Summary",
        ["Metric", "Value"],
        [
          ["Total bookings", data.summary.totalBookings],
          ["Completed bookings", data.summary.completedBookings],
          ["Pending bookings", data.summary.pendingBookings],
          ["Unique customers", data.summary.uniqueCustomers],
          ["Completed revenue", data.summary.totalRevenue],
        ],
      ),
      csvSection(
        "Booking Volume",
        ["Month", "Count"],
        data.bookingVolumeMonthly.map((row) => [row.month, row.count]),
      ),
      csvSection(
        "Booking Revenue",
        ["Month", "Revenue"],
        data.bookingRevenueMonthly.map((row) => [row.month, row.revenue]),
      ),
      csvSection(
        "Bookings by Status",
        ["Status", "Count"],
        data.bookingsByStatus.map((row) => [row.status, row.count]),
      ),
    );
  }

  if (include("inventory")) {
    sections.push(
      csvSection(
        "Inventory Valuation by Category",
        ["Category", "Value"],
        data.inventoryByCategory.map((row) => [row.category, row.value]),
      ),
      csvSection(
        "Low Stock Products",
        ["Product", "SKU", "Stock", "Minimum"],
        data.lowStockProducts.map((row) => [
          row.name,
          row.sku,
          row.stock,
          row.minimum,
        ]),
      ),
    );
  }

  if (include("branches")) {
    sections.push(
      csvSection(
        "Branch Performance",
        ["Branch", "Bookings", "Completed", "Revenue"],
        data.branchPerformance.map((row) => [
          row.branch,
          row.bookings,
          row.completed,
          row.revenue,
        ]),
      ),
    );
  }

  if (include("agents")) {
    sections.push(
      csvSection(
        "Agent Performance",
        ["Agent", "Bookings", "Completed", "Revenue"],
        data.agentPerformance.map((row) => [
          row.agent,
          row.bookings,
          row.completed,
          row.revenue,
        ]),
      ),
    );
  }

  return sections.join("\n");
}

function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  headers: string[],
  rows: (string | number)[][],
): void {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(headers);
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = 22;
  });
}

async function buildExcel(
  data: ReportsBundle,
  report: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Agrivet";
  const include = (name: string) => report === "all" || report === name;

  if (include("bookings")) {
    addSheet(
      workbook,
      "Summary",
      ["Metric", "Value"],
      [
        ["Total bookings", data.summary.totalBookings],
        ["Completed bookings", data.summary.completedBookings],
        ["Pending bookings", data.summary.pendingBookings],
        ["Unique customers", data.summary.uniqueCustomers],
        ["Completed revenue", data.summary.totalRevenue],
      ],
    );
    addSheet(
      workbook,
      "Booking Volume",
      ["Month", "Count"],
      data.bookingVolumeMonthly.map((row) => [row.month, row.count]),
    );
    addSheet(
      workbook,
      "Booking Revenue",
      ["Month", "Revenue"],
      data.bookingRevenueMonthly.map((row) => [row.month, row.revenue]),
    );
    addSheet(
      workbook,
      "Bookings by Status",
      ["Status", "Count"],
      data.bookingsByStatus.map((row) => [row.status, row.count]),
    );
  }

  if (include("inventory")) {
    addSheet(
      workbook,
      "Inventory Value",
      ["Category", "Value"],
      data.inventoryByCategory.map((row) => [row.category, row.value]),
    );
    addSheet(
      workbook,
      "Low Stock",
      ["Product", "SKU", "Stock", "Minimum"],
      data.lowStockProducts.map((row) => [
        row.name,
        row.sku,
        row.stock,
        row.minimum,
      ]),
    );
  }

  if (include("branches")) {
    addSheet(
      workbook,
      "Branches",
      ["Branch", "Bookings", "Completed", "Revenue"],
      data.branchPerformance.map((row) => [
        row.branch,
        row.bookings,
        row.completed,
        row.revenue,
      ]),
    );
  }

  if (include("agents")) {
    addSheet(
      workbook,
      "Agents",
      ["Agent", "Bookings", "Completed", "Revenue"],
      data.agentPerformance.map((row) => [
        row.agent,
        row.bookings,
        row.completed,
        row.revenue,
      ]),
    );
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function buildPdf(data: ReportsBundle, report: string): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const include = (name: string) => report === "all" || report === name;
  const heading = (text: string) => {
    doc.moveDown(0.8).fontSize(13).fillColor("#111827").text(text);
    doc.moveDown(0.3).fontSize(9).fillColor("#374151");
  };
  const line = (text: string) => doc.text(text);

  doc.fontSize(18).fillColor("#111827").text("Agrivet Reports");
  doc
    .fontSize(9)
    .fillColor("#6b7280")
    .text(
      `Generated ${data.generatedAt.toISOString()} · ${data.filters.dateFrom.toISOString().slice(0, 10)} to ${data.filters.dateTo.toISOString().slice(0, 10)}`,
    );

  if (include("bookings")) {
    heading("Summary");
    line(`Total bookings: ${data.summary.totalBookings}`);
    line(`Completed bookings: ${data.summary.completedBookings}`);
    line(`Pending bookings: ${data.summary.pendingBookings}`);
    line(`Unique customers: ${data.summary.uniqueCustomers}`);
    line(`Completed revenue: PHP ${data.summary.totalRevenue.toLocaleString()}`);

    heading("Booking Volume");
    data.bookingVolumeMonthly.forEach((row) =>
      line(`${row.month}: ${row.count}`),
    );

    heading("Booking Revenue");
    data.bookingRevenueMonthly.forEach((row) =>
      line(`${row.month}: PHP ${row.revenue.toLocaleString()}`),
    );

    heading("Bookings by Status");
    data.bookingsByStatus.forEach((row) =>
      line(`${row.status}: ${row.count}`),
    );
  }

  if (include("inventory")) {
    heading("Inventory Valuation by Category");
    data.inventoryByCategory.forEach((row) =>
      line(`${row.category}: PHP ${row.value.toLocaleString()}`),
    );

    heading("Low Stock Products");
    data.lowStockProducts.forEach((row) =>
      line(`${row.name} (${row.sku}): ${row.stock} / minimum ${row.minimum}`),
    );
  }

  if (include("branches")) {
    heading("Branch Performance");
    data.branchPerformance.forEach((row) =>
      line(
        `${row.branch}: ${row.bookings} bookings (${row.completed} completed) · PHP ${row.revenue.toLocaleString()}`,
      ),
    );
  }

  if (include("agents")) {
    heading("Agent Performance");
    data.agentPerformance.forEach((row) =>
      line(
        `${row.agent}: ${row.bookings} bookings (${row.completed} completed) · PHP ${row.revenue.toLocaleString()}`,
      ),
    );
  }

  doc.end();
  return done;
}

export async function generateReportExport(
  query: ReportExportQueryDto,
): Promise<ReportExport> {
  const data = await generateReports(query);
  const date = new Date().toISOString().slice(0, 10);
  const base = `agrivet-report-${query.report}-${date}`;

  if (query.format === "csv") {
    return {
      filename: `${base}.csv`,
      contentType: "text/csv; charset=utf-8",
      body: buildCsv(data, query.report),
    };
  }
  if (query.format === "excel") {
    return {
      filename: `${base}.xlsx`,
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: await buildExcel(data, query.report),
    };
  }
  return {
    filename: `${base}.pdf`,
    contentType: "application/pdf",
    body: await buildPdf(data, query.report),
  };
}
