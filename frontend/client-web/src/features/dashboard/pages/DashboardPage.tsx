import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Boxes,
  Users as UsersIcon,
  UserCog,
  Building2,
  CircleDollarSign,
} from "lucide-react";

import { mockCustomers } from "@/data/mock-customers";
import { mockAgents } from "@/data/mock-agents";
import { mockBranches } from "@/data/mock-branches";
import { mockReports } from "@/data/mock-reports";
import { useProductsStore } from "@/features/products/hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { getStockStatus, isLowStock, isOutOfStock } from "@/lib/stock";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  humanize,
} from "@/lib/utils";
import {
  getBookingStatusVariant,
  getStockStatusVariant,
  StatusBadge,
} from "@/components/common/StatusBadge";

export function DashboardPage() {
  const { products } = useProductsStore();
  const { categories } = useCategoriesStore();
  const { bookings } = useBookingsStore();

  const totalProducts = products.length;
  // Cost price is optional, so fall back to selling price to value stock on hand.
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * (p.costPrice ?? p.sellingPrice),
    0
  );
  // Low stock and out of stock are counted separately so the two alerts never
  // overlap; an out-of-stock item is not also reported as "low".
  const lowStockItems = useMemo(
    () =>
      products.filter((p) =>
        isLowStock(p.stockQuantity, p.minimumStockLevel)
      ),
    [products]
  );
  const outOfStockItems = useMemo(
    () => products.filter((p) => isOutOfStock(p.stockQuantity)),
    [products]
  );
  const stockAlertItems = useMemo(
    () => [...outOfStockItems, ...lowStockItems].slice(0, 5),
    [outOfStockItems, lowStockItems]
  );
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysBookings = bookings.filter((b) => b.bookingDate === todayIso);
  const totalCustomers = mockCustomers.length;
  const totalAgents = mockAgents.filter((a) => a.status === "active").length;
  const totalBranches = mockBranches.filter((b) => b.status === "active").length;

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [bookings]
  );

  const recentCustomers = useMemo(
    () =>
      [...mockCustomers]
        .sort(
          (a, b) =>
            new Date(b.registeredDate).getTime() -
            new Date(a.registeredDate).getTime()
        )
        .slice(0, 5),
    []
  );

  const maxBranchBookings = Math.max(
    ...mockReports.branchPerformance.map((b) => b.bookings)
  );
  const maxAgentRevenue = Math.max(
    ...mockReports.agentPerformance.map((a) => a.revenue)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of bookings, inventory, and business performance."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatisticsCard
          label="Total Products"
          value={formatNumber(totalProducts)}
          icon={<Package className="h-4 w-4" />}
          trend={{ value: 8, direction: "up", label: "vs last month" }}
        />
        <StatisticsCard
          label="Inventory Value"
          value={formatCurrency(totalInventoryValue)}
          icon={<CircleDollarSign className="h-4 w-4" />}
          trend={{ value: 4, direction: "up", label: "vs last month" }}
        />
        <StatisticsCard
          label="Low Stock Items"
          value={formatNumber(lowStockItems.length)}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="Above zero but at or below the minimum level"
        />
        <StatisticsCard
          label="Out of Stock"
          value={formatNumber(outOfStockItems.length)}
          icon={<Boxes className="h-4 w-4" />}
          hint="Needs immediate replenishment"
        />
        <StatisticsCard
          label="Pending Bookings"
          value={formatNumber(pendingBookings.length)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatisticsCard
          label="Today's Bookings"
          value={formatNumber(todaysBookings.length)}
          icon={<ShoppingCart className="h-4 w-4" />}
        />
        <StatisticsCard
          label="Total Customers"
          value={formatNumber(totalCustomers)}
          icon={<UsersIcon className="h-4 w-4" />}
          trend={{ value: 12, direction: "up", label: "new this month" }}
        />
        <StatisticsCard
          label="Active Agents"
          value={formatNumber(totalAgents)}
          icon={<UserCog className="h-4 w-4" />}
        />
        <StatisticsCard
          label="Active Branches"
          value={formatNumber(totalBranches)}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Booking Volume</CardTitle>
              <p className="text-xs text-muted-foreground">
                Monthly booking count for the current year.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={mockReports.bookingVolumeMonthly}
                  margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="booking" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="100%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                      padding: "8px 12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#booking)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">By Status</CardTitle>
              <p className="text-xs text-muted-foreground">
                Current booking distribution.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockReports.bookingsByStatus.map((entry) => {
              const total = mockReports.bookingsByStatus.reduce(
                (s, e) => s + e.count,
                0
              );
              const pct = total > 0 ? (entry.count / total) * 100 : 0;
              return (
                <div key={entry.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {entry.status}
                    </span>
                    <span className="font-medium tabular-nums">
                      {entry.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Branch Performance</CardTitle>
              <p className="text-xs text-muted-foreground">
                Bookings and revenue by branch location.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Branch</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-[120px]">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.branchPerformance
                  .sort((a, b) => b.bookings - a.bookings)
                  .map((bp) => (
                    <TableRow key={bp.branch}>
                      <TableCell className="font-medium">{bp.branch}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(bp.bookings)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(bp.revenue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary/80"
                              style={{
                                width: `${(bp.bookings / maxBranchBookings) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {Math.round(
                              (bp.bookings / maxBranchBookings) * 100
                            )}
                            %
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Agent Leaderboard</CardTitle>
              <p className="text-xs text-muted-foreground">
                Top performing sales agents by revenue.
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Agent</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-[120px]">Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockReports.agentPerformance.map((ap, idx) => (
                  <TableRow key={ap.agent}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{ap.agent}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(ap.bookings)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(ap.revenue)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: `${(ap.revenue / maxAgentRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          {Math.round(
                            (ap.revenue / maxAgentRevenue) * 100
                          )}
                          %
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Recent Bookings</CardTitle>
              <p className="text-xs text-muted-foreground">
                Latest booking transactions across all branches.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="text-sm font-medium hover:text-primary"
                      >
                        {booking.reference}
                      </Link>
                      <StatusBadge
                        variant={getBookingStatusVariant(booking.status)}
                        label={humanize(booking.status)}
                      />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {booking.customerName} · {booking.branchName}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-medium tabular-nums">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDate(booking.bookingDate)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
              <p className="text-xs text-muted-foreground">
                Out-of-stock products and items at or below their minimum level.
              </p>
            </div>
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/inventory">Manage stock</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Product</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Minimum</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockAlertItems.map((product) => {
                  const stockStatus = getStockStatus(
                    product.stockQuantity,
                    product.minimumStockLevel
                  );
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {product.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {product.stockQuantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {product.minimumStockLevel}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={getStockStatusVariant(stockStatus)}
                          className="text-[10px]"
                        >
                          {stockStatus === "out_of_stock"
                            ? "Out"
                            : stockStatus === "critical"
                            ? "Critical"
                            : "Low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Recent Customers</CardTitle>
            <p className="text-xs text-muted-foreground">
              Newly registered customers.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/customers">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {customer.fullName
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {customer.fullName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {customer.totalBookings} bookings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
