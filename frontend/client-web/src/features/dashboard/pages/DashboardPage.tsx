import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  Users as UsersIcon,
  UserCog,
  Building2,
  CircleDollarSign,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { ChartCard } from "@/components/common/ChartCard";
import { EmptyState } from "@/components/common/EmptyState";
import { NotificationsCard } from "@/features/notifications/components/NotificationsCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { mockCustomers } from "@/data/mock-customers";
import { mockAgents } from "@/data/mock-agents";
import { mockBranches } from "@/data/mock-branches";
import { mockBookings } from "@/data/mock-bookings";
import { mockReports } from "@/data/mock-reports";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  initials,
} from "@/lib/utils";
import { getStatusVariant, humanize } from "@/lib/status";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  axisProps,
  gridProps,
  tooltipProps,
} from "@/lib/chart-theme";
import { getInventorySummary } from "@/features/inventory/services/inventory.service";
import type { InventorySummary } from "@/types/inventory";

/**
 * Marks a panel whose figures come from the seeded sample dataset rather
 * than the live API, so no metric is mistaken for a real measurement.
 */
function SampleDataBadge() {
  return (
    <Badge variant="muted" className="shrink-0 text-xs">
      Sample data
    </Badge>
  );
}

export function DashboardPage() {
  const [inventorySummary, setInventorySummary] =
    useState<InventorySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getInventorySummary()
      .then((summary) => {
        if (!cancelled) setInventorySummary(summary);
      })
      .catch(() => {
        // The dashboard still renders booking and customer metrics if the
        // inventory summary cannot be loaded.
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockItems = inventorySummary?.alerts ?? [];
  const pendingBookings = mockBookings.filter((b) => b.status === "pending");
  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysBookings = mockBookings.filter((b) => b.bookingDate === todayIso);
  const totalCustomers = mockCustomers.length;
  const totalAgents = mockAgents.filter((a) => a.status === "active").length;
  const totalBranches = mockBranches.filter((b) => b.status === "active").length;

  const recentBookings = useMemo(
    () =>
      [...mockBookings]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    []
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

  const branchPerformance = useMemo(
    () =>
      [...mockReports.branchPerformance].sort(
        (a, b) => b.bookings - a.bookings
      ),
    []
  );

  const maxBranchBookings = Math.max(
    ...mockReports.branchPerformance.map((b) => b.bookings),
    1
  );
  const maxAgentRevenue = Math.max(
    ...mockReports.agentPerformance.map((a) => a.revenue),
    1
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of bookings, inventory, and business performance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatisticsCard
          label="Total Products"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              formatNumber(inventorySummary?.totalProducts ?? 0)
            )
          }
          icon={<Package className="h-4 w-4" aria-hidden />}
        />
        <StatisticsCard
          label="Inventory Value"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              formatCurrency(inventorySummary?.inventoryValue ?? 0)
            )
          }
          icon={<CircleDollarSign className="h-4 w-4" aria-hidden />}
        />
        <StatisticsCard
          label="Low Stock Items"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              formatNumber(lowStockItems.length)
            )
          }
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          hint="Items below minimum stock level"
        />
        <StatisticsCard
          label="Pending Bookings"
          value={formatNumber(pendingBookings.length)}
          icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
          badge={<SampleDataBadge />}
        />
        <StatisticsCard
          label="Today's Bookings"
          value={formatNumber(todaysBookings.length)}
          icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
          badge={<SampleDataBadge />}
        />
        <StatisticsCard
          label="Total Customers"
          value={formatNumber(totalCustomers)}
          icon={<UsersIcon className="h-4 w-4" aria-hidden />}
          badge={<SampleDataBadge />}
        />
        <StatisticsCard
          label="Active Agents"
          value={formatNumber(totalAgents)}
          icon={<UserCog className="h-4 w-4" aria-hidden />}
          badge={<SampleDataBadge />}
        />
        <StatisticsCard
          label="Active Branches"
          value={formatNumber(totalBranches)}
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          badge={<SampleDataBadge />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Booking Volume"
          description="Monthly booking count for the current year."
          actions={<SampleDataBadge />}
          height="h-[240px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={mockReports.bookingVolumeMonthly}
              margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
            >
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="hsl(var(--chart-1))"
                fillOpacity={0.1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <NotificationsCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Branch Performance"
          description="Bookings and revenue by branch location."
          actions={<SampleDataBadge />}
          height="auto"
        >
          {branchPerformance.length === 0 ? (
            <EmptyState
              title="No branch data"
              description="Branch performance will appear here once bookings are recorded."
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
                  <TableHead scope="col" className="w-[140px]">
                    Activity
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPerformance.map((bp) => (
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
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(bp.bookings / maxBranchBookings) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                          {Math.round((bp.bookings / maxBranchBookings) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>

        <ChartCard
          title="Agent Leaderboard"
          description="Top performing sales agents by revenue."
          actions={<SampleDataBadge />}
          height="auto"
        >
          {mockReports.agentPerformance.length === 0 ? (
            <EmptyState
              title="No agent data"
              description="Agent performance will appear here once bookings are recorded."
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
                  <TableHead scope="col" className="w-[140px]">
                    Performance
                  </TableHead>
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
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${(ap.revenue / maxAgentRevenue) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">
                          {Math.round((ap.revenue / maxAgentRevenue) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Recent Bookings"
          description="Latest booking transactions across all branches."
          actions={
            <>
              <SampleDataBadge />
              <Button asChild variant="ghost" size="sm" className="h-8">
                <Link to="/bookings">View all</Link>
              </Button>
            </>
          }
          height="auto"
        >
          {recentBookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="New bookings will appear here as soon as they are created."
            />
          ) : (
            <ul className="divide-y">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ShoppingCart
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/bookings/${booking.id}`}
                        className="truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {booking.reference}
                      </Link>
                      <StatusBadge
                        variant={getStatusVariant(booking.status)}
                        label={humanize(booking.status)}
                      />
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {booking.customerName} · {booking.branchName}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <div className="font-medium tabular-nums text-foreground">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <div className="text-muted-foreground">
                      {formatDate(booking.bookingDate)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard
          title="Low Stock Alert"
          description="Products that need restocking attention."
          actions={
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/inventory">Manage stock</Link>
            </Button>
          }
          height="auto"
        >
          {lowStockItems.length === 0 ? (
            <EmptyState
              title="Stock levels are healthy"
              description="No products are currently below their minimum stock level."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Product</TableHead>
                  <TableHead scope="col" className="text-right">
                    Stock
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Minimum
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.slice(0, 5).map((product) => (
                  <TableRow key={`${product.productId}-${product.branchId}`}>
                    <TableCell>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {product.productName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {product.currentStock}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {product.minimumStock}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge
                        variant={getStatusVariant(product.status)}
                        label={humanize(product.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Recent Customers"
        description="Newly registered customers."
        actions={
          <>
            <SampleDataBadge />
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/customers">View all</Link>
            </Button>
          </>
        }
        height="auto"
      >
        {recentCustomers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Newly registered customers will appear here."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {recentCustomers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {initials(customer.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {customer.fullName}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {customer.totalBookings} bookings
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </div>
  );
}
