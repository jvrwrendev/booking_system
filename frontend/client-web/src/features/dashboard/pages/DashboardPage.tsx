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
import {
  getInventorySummary,
  listInventoryBranches,
} from "@/features/inventory/services/inventory.service";
import {
  listBookingAgents,
  listBookings,
} from "@/features/bookings/services/bookings.service";
import { getReports } from "@/features/reports/services/reports.service";
import type { InventorySummary } from "@/types/inventory";
import type { Booking } from "@/types/booking";
import type { ReportsBundleDto } from "@/types/api";

export function DashboardPage() {
  const [inventorySummary, setInventorySummary] =
    useState<InventorySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [report, setReport] = useState<ReportsBundleDto | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [todaysBookings, setTodaysBookings] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [agentCount, setAgentCount] = useState(0);
  const [branchCount, setBranchCount] = useState(0);
  const [lookupsLoading, setLookupsLoading] = useState(true);

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

  useEffect(() => {
    let cancelled = false;
    getReports()
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        // Booking charts fall back to empty states.
      })
      .finally(() => {
        if (!cancelled) setReportLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const todayIso = new Date().toISOString().slice(0, 10);
    setBookingsLoading(true);

    Promise.all([
      listBookings({ status: "pending", pageSize: 1 }),
      listBookings({ dateFrom: todayIso, dateTo: todayIso, pageSize: 1 }),
      listBookings({ pageSize: 5, sortBy: "createdAt", sortOrder: "desc" }),
    ])
      .then(([pending, today, recent]) => {
        if (cancelled) return;
        setPendingBookings(pending.total);
        setTodaysBookings(today.total);
        setRecentBookings(recent.bookings);
      })
      .catch(() => {
        // Booking widgets show their empty states if the API is unavailable.
      })
      .finally(() => {
        if (!cancelled) setBookingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listBookingAgents(), listInventoryBranches()])
      .then(([agents, branches]) => {
        if (cancelled) return;
        setAgentCount(agents.length);
        setBranchCount(
          branches.filter((branch) => branch.status === "active").length,
        );
      })
      .catch(() => {
        // Counts stay at zero when lookups fail.
      })
      .finally(() => {
        if (!cancelled) setLookupsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lowStockItems = inventorySummary?.alerts ?? [];
  const totalCustomers = report?.summary.uniqueCustomers ?? 0;

  const recentCustomers = useMemo(() => {
    const seen = new Set<string>();
    const customers: {
      id: string;
      fullName: string;
      reference: string;
      branchName: string;
    }[] = [];

    for (const booking of recentBookings) {
      const key = booking.customerId || booking.customerName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      customers.push({
        id: key,
        fullName: booking.customerName,
        reference: booking.reference,
        branchName: booking.branchName,
      });
      if (customers.length >= 5) break;
    }

    return customers;
  }, [recentBookings]);

  const branchPerformance = useMemo(
    () =>
      [...(report?.branchPerformance ?? [])].sort(
        (a, b) => b.bookings - a.bookings
      ),
    [report]
  );

  const maxBranchBookings = Math.max(
    ...(report?.branchPerformance.map((b) => b.bookings) ?? [0]),
    1
  );
  const maxAgentRevenue = Math.max(
    ...(report?.agentPerformance.map((a) => a.revenue) ?? [0]),
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
          value={
            bookingsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              formatNumber(pendingBookings)
            )
          }
          icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
        />
        <StatisticsCard
          label="Today's Bookings"
          value={
            bookingsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              formatNumber(todaysBookings)
            )
          }
          icon={<ShoppingCart className="h-4 w-4" aria-hidden />}
        />
        <StatisticsCard
          label="Customers"
          value={
            reportLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              formatNumber(totalCustomers)
            )
          }
          icon={<UsersIcon className="h-4 w-4" aria-hidden />}
          hint="Unique customers in the last 9 months"
        />
        <StatisticsCard
          label="Active Agents"
          value={
            lookupsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              formatNumber(agentCount)
            )
          }
          icon={<UserCog className="h-4 w-4" aria-hidden />}
        />
        <StatisticsCard
          label="Active Branches"
          value={
            lookupsLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              formatNumber(branchCount)
            )
          }
          icon={<Building2 className="h-4 w-4" aria-hidden />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Booking Volume"
          description="Monthly booking count."
          height="h-[240px]"
        >
          {reportLoading ? (
            <Skeleton className="h-full w-full" />
          ) : (report?.bookingVolumeMonthly.length ?? 0) === 0 ? (
            <EmptyState
              title="No booking volume"
              description="Monthly booking activity will appear here."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={report?.bookingVolumeMonthly ?? []}
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
          )}
        </ChartCard>

        <NotificationsCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Branch Performance"
          description="Bookings and completed revenue by branch location."
          height="auto"
        >
          {reportLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : branchPerformance.length === 0 ? (
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
                    Completed Revenue
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
          description="Top performing sales agents by completed revenue."
          height="auto"
        >
          {reportLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (report?.agentPerformance.length ?? 0) === 0 ? (
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
                    Completed Revenue
                  </TableHead>
                  <TableHead scope="col" className="w-[140px]">
                    Performance
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(report?.agentPerformance ?? []).map((ap, idx) => (
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
            <Button asChild variant="ghost" size="sm" className="h-8">
              <Link to="/bookings">View all</Link>
            </Button>
          }
          height="auto"
        >
          {bookingsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : recentBookings.length === 0 ? (
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
        description="Customers with the latest bookings."
        actions={
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/customers">View all</Link>
          </Button>
        }
        height="auto"
      >
        {bookingsLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : recentCustomers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Customers with recent bookings will appear here."
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
                    {customer.branchName.replace(" Branch", "")} ·{" "}
                    {customer.reference}
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
