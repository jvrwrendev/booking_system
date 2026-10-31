import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, ORDER_STATUS_OPTIONS } from "@/lib/status";
import { ApiError } from "@/lib/api-client";
import {
  downloadReport,
  getReports,
  type ReportFilters,
} from "../services/reports.service";
import type {
  ReportExportFormat,
  ReportSection,
  ReportsBundleDto,
} from "@/types/api";
import type { InventoryBranch } from "@/types/inventory";
import { listInventoryBranches } from "@/features/inventory/services/inventory.service";
import {
  listBookingAgents,
  type BookingAgentOption,
} from "@/features/bookings/services/bookings.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  axisProps,
  CHART_COLORS,
  gridProps,
  legendProps,
  tooltipProps,
} from "@/lib/chart-theme";

type ReportTab = "inventory" | "bookings" | "branches" | "agents";

function reportErrorMessage(error: unknown): string {
  return error instanceof ApiError
    ? error.message
    : "Could not load reports. Please try again.";
}

function FilterBar({
  filters,
  branches,
  agents,
  onChange,
  onReset,
  onRefresh,
  loading,
}: {
  filters: ReportFilters;
  branches: InventoryBranch[];
  agents: BookingAgentOption[];
  onChange: (key: keyof ReportFilters, value: string) => void;
  onReset: () => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="space-y-1">
        <Label htmlFor="report-from" className="text-xs">
          From
        </Label>
        <Input
          id="report-from"
          type="date"
          value={filters.dateFrom ?? ""}
          onChange={(event) => onChange("dateFrom", event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="report-to" className="text-xs">
          To
        </Label>
        <Input
          id="report-to"
          type="date"
          value={filters.dateTo ?? ""}
          onChange={(event) => onChange("dateTo", event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="report-branch" className="text-xs">
          Branch
        </Label>
        <Select
          value={filters.branchId ?? "all"}
          onValueChange={(value) => onChange("branchId", value)}
        >
          <SelectTrigger id="report-branch" aria-label="Filter by branch">
            <SelectValue placeholder="All branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="report-agent" className="text-xs">
          Agent
        </Label>
        <Select
          value={filters.agentId ?? "all"}
          onValueChange={(value) => onChange("agentId", value)}
        >
          <SelectTrigger id="report-agent" aria-label="Filter by agent">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All agents</SelectItem>
            {agents
              .filter((agent) => agent.agentId)
              .map((agent) => (
                <SelectItem key={agent.id} value={agent.agentId ?? agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="report-status" className="text-xs">
          Booking status
        </Label>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(value) => onChange("status", value)}
        >
          <SelectTrigger id="report-status" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUS_OPTIONS.filter(
              (option) => option.value !== "all",
            ).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onReset}
        >
          Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("inventory");
  const [filters, setFilters] = useState<ReportFilters>({});
  const [report, setReport] = useState<ReportsBundleDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<ReportExportFormat | null>(null);
  const [branches, setBranches] = useState<InventoryBranch[]>([]);
  const [agents, setAgents] = useState<BookingAgentOption[]>([]);
  const requestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    listInventoryBranches()
      .then((result) => {
        if (!cancelled) setBranches(result);
      })
      .catch(() => {
        // The branch filter simply stays empty if lookups fail.
      });
    listBookingAgents()
      .then((result) => {
        if (!cancelled) setAgents(result);
      })
      .catch(() => {
        // The agent filter simply stays empty if lookups fail.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    try {
      const data = await getReports(filters);
      if (currentRequest !== requestId.current) return;
      setReport(data);
      setError(null);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(reportErrorMessage(err));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value && value !== "all" ? value : undefined,
    }));
  };

  const handleExport = async (kind: ReportExportFormat) => {
    setExporting(kind);
    try {
      await downloadReport(filters, kind, activeTab as ReportSection);
      toast.success(`${kind.toUpperCase()} report downloaded`);
    } catch (err) {
      toast.error("Export failed", {
        description:
          err instanceof ApiError
            ? err.message
            : "The report could not be generated.",
      });
    } finally {
      setExporting(null);
    }
  };

  const generatedLabel = useMemo(() => {
    if (!report) return null;
    return new Date(report.generatedAt).toLocaleString();
  }, [report]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational and financial reports for your agrivet business."
        breadcrumbs={[{ label: "Analytics" }, { label: "Reports" }]}
        actions={
          <>
            <Badge variant="muted" className="shrink-0 text-xs">
              Live data
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={loading || exporting !== null}
            >
              {exporting === "csv" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <FileText className="h-4 w-4" aria-hidden />
              )}
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              disabled={loading || exporting !== null}
            >
              {exporting === "excel" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
              )}
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={loading || exporting !== null}
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Download className="h-4 w-4" aria-hidden />
              )}
              PDF
            </Button>
          </>
        }
      />

      <FilterBar
        filters={filters}
        branches={branches}
        agents={agents}
        onChange={handleFilterChange}
        onReset={() => setFilters({})}
        onRefresh={() => void load()}
        loading={loading}
      />

      {generatedLabel && (
        <p className="text-xs text-muted-foreground">
          Generated {generatedLabel}. Exports include the filters above and the
          currently selected report tab.
        </p>
      )}

      {loading && !report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-[320px] w-full" />
        </div>
      ) : error && !report ? (
        <ErrorState
          title="Could not load reports"
          message={error}
          onRetry={() => void load()}
        />
      ) : report ? (
        <>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ReportTab)}
          >
            <TabsList className="flex-wrap">
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard
                  title="Inventory Valuation by Category"
                  description="Share of total stock value per category."
                  height="h-[260px]"
                >
                  {report.inventoryByCategory.length === 0 ? (
                    <EmptyState
                      title="No valuation data"
                      description="Category valuations appear once products carry stock."
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.inventoryByCategory}
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="category"
                        >
                          {report.inventoryByCategory.map((_, idx) => (
                            <Cell
                              key={idx}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          {...tooltipProps}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">
                      Low Stock Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.lowStockProducts.length === 0 ? (
                      <EmptyState
                        title="No low stock products"
                        description="Every product is currently above its minimum level."
                      />
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead scope="col">Product</TableHead>
                            <TableHead scope="col">SKU</TableHead>
                            <TableHead scope="col" className="text-right">
                              Stock
                            </TableHead>
                            <TableHead scope="col" className="text-right">
                              Minimum
                            </TableHead>
                            <TableHead scope="col" className="text-right">
                              Reorder
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {report.lowStockProducts.map((product) => (
                            <TableRow key={`${product.sku}-${product.name}`}>
                              <TableCell className="font-medium text-foreground">
                                {product.name}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {product.sku}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {product.stock}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {product.minimum}
                              </TableCell>
                              <TableCell className="text-right font-medium tabular-nums">
                                {Math.max(
                                  0,
                                  product.minimum * 2 - product.stock,
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatisticsCard
                  label="Total Bookings"
                  value={formatNumber(report.summary.totalBookings)}
                  icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                />
                <StatisticsCard
                  label="Completed"
                  value={formatNumber(report.summary.completedBookings)}
                  icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                />
                <StatisticsCard
                  label="Pending"
                  value={formatNumber(report.summary.pendingBookings)}
                  icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                />
                <StatisticsCard
                  label="Completed Revenue"
                  value={formatCurrency(report.summary.totalRevenue)}
                  icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
                  hint="Completed and delivered bookings only"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard
                  title="Booking Volume"
                  description="Monthly bookings for the selected period."
                  height="h-[260px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.bookingVolumeMonthly}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="month" {...axisProps} />
                      <YAxis {...axisProps} />
                      <Tooltip {...tooltipProps} />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Revenue Trend"
                  description="Monthly completed revenue for the selected period."
                  height="h-[260px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.bookingRevenueMonthly}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="month" {...axisProps} />
                      <YAxis
                        {...axisProps}
                        tickFormatter={(value) => `${Number(value) / 1000}k`}
                      />
                      <Tooltip
                        {...tooltipProps}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bookings by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.bookingsByStatus.length === 0 ? (
                    <EmptyState
                      title="No bookings recorded"
                      description="Status breakdown appears once bookings exist."
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Status</TableHead>
                          <TableHead scope="col" className="text-right">
                            Count
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            % of Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.bookingsByStatus.map((row) => (
                          <TableRow key={row.status}>
                            <TableCell>
                              <StatusBadge
                                variant={getStatusVariant(
                                  row.status.toLowerCase().replace(/\s+/g, "_"),
                                )}
                                label={row.status}
                              />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {row.count}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {report.summary.totalBookings === 0
                                ? "0.0%"
                                : `${(
                                    (row.count /
                                      report.summary.totalBookings) *
                                    100
                                  ).toFixed(1)}%`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branches" className="space-y-4">
              <ChartCard
                title="Branch Performance"
                description="Bookings and completed revenue by branch location."
                height="h-[300px]"
              >
                {report.branchPerformance.length === 0 ? (
                  <EmptyState
                    title="No branch data"
                    description="Branch performance appears once bookings exist."
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.branchPerformance}>
                      <CartesianGrid {...gridProps} />
                      <XAxis dataKey="branch" {...axisProps} />
                      <YAxis yAxisId="bookings" {...axisProps} />
                      <YAxis
                        yAxisId="revenue"
                        orientation="right"
                        {...axisProps}
                        tickFormatter={(value) =>
                          `${Number(value) / 1000}k`
                        }
                      />
                      <Tooltip
                        {...tooltipProps}
                        formatter={(value: number, name: string) =>
                          name === "revenue" ? formatCurrency(value) : value
                        }
                      />
                      <Legend {...legendProps} />
                      <Bar
                        yAxisId="bookings"
                        dataKey="bookings"
                        fill="hsl(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="revenue"
                        dataKey="revenue"
                        fill="hsl(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Branch Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.branchPerformance.length === 0 ? (
                    <EmptyState
                      title="No branch data"
                      description="Branch performance appears once bookings exist."
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Branch</TableHead>
                          <TableHead scope="col" className="text-right">
                            Bookings
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Completed
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Completed Revenue
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Avg Completed Revenue
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.branchPerformance.map((branch) => (
                          <TableRow key={branch.branch}>
                            <TableCell className="font-medium text-foreground">
                              {branch.branch}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {branch.bookings}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {branch.completed}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(branch.revenue)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(
                                branch.completed === 0
                                  ? 0
                                  : Math.round(
                                      branch.revenue / branch.completed,
                                    ),
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Agent Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {report.agentPerformance.length === 0 ? (
                    <EmptyState
                      title="No agent data"
                      description="Agent performance appears once bookings exist."
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Agent</TableHead>
                          <TableHead scope="col" className="text-right">
                            Bookings
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Completed
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Completed Revenue
                          </TableHead>
                          <TableHead scope="col" className="text-right">
                            Avg Completed Revenue
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.agentPerformance.map((agent) => (
                          <TableRow key={agent.agent}>
                            <TableCell className="font-medium text-foreground">
                              {agent.agent}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {agent.bookings}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {agent.completed}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(agent.revenue)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(
                                agent.completed === 0
                                  ? 0
                                  : Math.round(
                                      agent.revenue / agent.completed,
                                    ),
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
}
