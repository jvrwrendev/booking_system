import { useMemo, useState } from "react";
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
import { Download, FileSpreadsheet, FileText, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { ChartCard } from "@/components/common/ChartCard";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getStatusVariant } from "@/lib/status";

import { mockReports } from "@/data/mock-reports";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  axisProps,
  CHART_COLORS,
  gridProps,
  legendProps,
  tooltipProps,
} from "@/lib/chart-theme";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState("inventory");

  const handleExport = (kind: "csv" | "pdf" | "excel") => {
    toast.info(`${kind.toUpperCase()} export queued`, {
      description: "Mock export — connect a backend to enable real downloads.",
    });
  };

  const totalRevenue = useMemo(
    () => mockReports.bookingRevenueMonthly.reduce((s, m) => s + m.revenue, 0),
    []
  );

  const totalBookings = useMemo(
    () => mockReports.bookingsByStatus.reduce((s, m) => s + m.count, 0),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational and financial reports for your agrivet business."
        breadcrumbs={[{ label: "Analytics" }, { label: "Reports" }]}
        actions={
          <>
            <Badge variant="muted" className="shrink-0 text-xs">
              Sample data
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
            >
              <FileText className="h-4 w-4" aria-hidden />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
            >
              <Download className="h-4 w-4" aria-hidden />
              PDF
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              {mockReports.inventoryByCategory.length === 0 ? (
                <EmptyState
                  title="No valuation data"
                  description="Category valuations appear once products carry stock."
                />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockReports.inventoryByCategory}
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="category"
                    >
                      {mockReports.inventoryByCategory.map((_, idx) => (
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
                <CardTitle className="text-base">Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                {mockReports.lowStockProducts.length === 0 ? (
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
                      {mockReports.lowStockProducts.map((p) => (
                        <TableRow key={p.sku}>
                          <TableCell className="font-medium text-foreground">
                            {p.name}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.sku}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {p.stock}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {p.minimum}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {Math.max(0, p.minimum * 2 - p.stock)}
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
              value={formatNumber(totalBookings)}
              icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
            />
            <StatisticsCard
              label="Completed"
              value={formatNumber(
                mockReports.bookingsByStatus.find(
                  (m) => m.status === "Completed"
                )?.count ?? 0
              )}
              icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
            />
            <StatisticsCard
              label="Pending"
              value={formatNumber(
                mockReports.bookingsByStatus.find((m) => m.status === "Pending")
                  ?.count ?? 0
              )}
              icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
            />
            <StatisticsCard
              label="Total Revenue"
              value={formatCurrency(totalRevenue)}
              icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Booking Volume"
              description="Monthly bookings over the last 9 months."
              height="h-[260px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockReports.bookingVolumeMonthly}>
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
              description="Monthly revenue over the last 9 months."
              height="h-[260px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockReports.bookingRevenueMonthly}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis
                    {...axisProps}
                    tickFormatter={(v) => `${Number(v) / 1000}k`}
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
              {mockReports.bookingsByStatus.length === 0 ? (
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
                    {mockReports.bookingsByStatus.map((row) => (
                      <TableRow key={row.status}>
                        <TableCell>
                          <StatusBadge
                            variant={getStatusVariant(
                              row.status.toLowerCase().replace(/\s+/g, "_")
                            )}
                            label={row.status}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.count}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {totalBookings === 0
                            ? "0.0%"
                            : `${((row.count / totalBookings) * 100).toFixed(1)}%`}
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
            description="Bookings and revenue by branch location."
            height="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockReports.branchPerformance}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="branch" {...axisProps} />
                <YAxis {...axisProps} />
                <Tooltip
                  {...tooltipProps}
                  formatter={(value: number, name: string) =>
                    name === "revenue" ? formatCurrency(value) : value
                  }
                />
                <Legend {...legendProps} />
                <Bar
                  dataKey="bookings"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Branch Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {mockReports.branchPerformance.length === 0 ? (
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
                        Revenue
                      </TableHead>
                      <TableHead scope="col" className="text-right">
                        Avg per Booking
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReports.branchPerformance.map((b) => (
                      <TableRow key={b.branch}>
                        <TableCell className="font-medium text-foreground">
                          {b.branch}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {b.bookings}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(b.revenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(Math.round(b.revenue / b.bookings))}
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
              <CardTitle className="text-base">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {mockReports.agentPerformance.length === 0 ? (
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
                        Revenue
                      </TableHead>
                      <TableHead scope="col" className="text-right">
                        Avg per Booking
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReports.agentPerformance.map((a) => (
                      <TableRow key={a.agent}>
                        <TableCell className="font-medium text-foreground">
                          {a.agent}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {a.bookings}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(a.revenue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(Math.round(a.revenue / a.bookings))}
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
    </div>
  );
}
