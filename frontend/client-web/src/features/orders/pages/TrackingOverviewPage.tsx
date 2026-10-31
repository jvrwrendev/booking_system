import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  Filter,
  MapPin,
  Radio,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { AssignedAdminCell } from "@/components/common/AssignedAdminCell";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";

import { relativeTime } from "@/lib/utils";
import { ORDER_JOURNEY, orderJourneyIndex } from "../lib/journey";

const AGENT_STATUS_OPTIONS = [
  "pending",
  "accepted",
  "assigned",
  "admin_accepted",
  "review_order",
  "confirmed",
  "processing",
  "ready",
  "ready_for_delivery",
  "completed",
  "cancelled",
  "rejected",
] as const;

const BRANCH_STATUS_OPTIONS = [
  "pending",
  "assigned",
  "accepted",
  "admin_accepted",
  "review_order",
  "processing",
  "ready",
  "ready_for_delivery",
  "completed",
  "rejected",
] as const;

function JourneyProgress({ status }: { status: string }) {
  const idx = orderJourneyIndex(status);
  const pct = idx >= 0 ? ((idx + 1) / ORDER_JOURNEY.length) * 100 : 0;
  return (
    <div className="w-full min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {idx >= 0
            ? `Step ${idx + 1} of ${ORDER_JOURNEY.length}`
            : "Order ended"}
        </span>
        <span className="font-medium tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            idx >= 0 ? "bg-primary" : "bg-muted-foreground/40"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TrackingCard({
  href,
  reference,
  statusBadge,
  status,
  adminId,
  adminName,
  children,
}: {
  href: string;
  reference: string;
  statusBadge: ReactNode;
  status: string;
  adminId?: string | null;
  adminName?: string | null;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex h-full flex-col gap-3 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={href}
            className="font-mono text-sm font-semibold text-primary hover:underline"
          >
            {reference}
          </Link>
          <span className="shrink-0">{statusBadge}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1 text-sm text-muted-foreground">
          {children}
        </div>

        <div className="rounded-md border bg-muted/30 px-2.5 py-2">
          <JourneyProgress status={status} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              <UserRound className="h-3 w-3" />
              Assigned
            </p>
            <AssignedAdminCell
              adminId={adminId}
              adminName={adminName}
              stacked
            />
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link to={href}>
              Track
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TrackingOverviewPage() {
  const { bookings } = useBookingsStore();
  const { orders: branchOrders } = useBranchOrdersStore();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [search, setSearch] = useState("");
  const [agentStatus, setAgentStatus] = useState<string>("all");
  const [branchStatus, setBranchStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("agent");
  const [page, setPage] = useState(0);

  const q = search.trim().toLowerCase();
  const matchesQuery = useCallback(
    (...fields: Array<string | null | undefined>) =>
      !q || fields.some((f) => f?.toLowerCase().includes(q)),
    [q]
  );

  const filteredAgentOrders = useMemo(
    () =>
      [...bookings]
        .filter(
          (b) =>
            (agentStatus === "all" || b.status === agentStatus) &&
            matchesQuery(
              b.reference,
              b.customerName,
              b.branchName,
              b.agentName,
              b.assignedAdminName
            )
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [bookings, agentStatus, matchesQuery]
  );

  const filteredBranchOrders = useMemo(
    () =>
      [...branchOrders]
        .filter(
          (o) =>
            (branchStatus === "all" || o.status === branchStatus) &&
            matchesQuery(
              o.reference,
              o.branchName,
              o.assignedAdminName
            )
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [branchOrders, branchStatus, matchesQuery]
  );

  // Both card grids share the same pagination control.
  const pageSize = 9;
  const activeCount =
    activeTab === "agent" ? filteredAgentOrders.length : filteredBranchOrders.length;
  const totalPages = Math.max(1, Math.ceil(activeCount / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedAgentOrders = filteredAgentOrders.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );
  const paginatedBranchOrders = filteredBranchOrders.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );

  // A new search or filter always returns the user to the first page.
  useEffect(() => {
    setPage(0);
  }, [search, agentStatus, branchStatus]);

  const activeStatus =
    activeTab === "agent" ? agentStatus : branchStatus;
  const setActiveStatus = (v: string) =>
    activeTab === "agent" ? setAgentStatus(v) : setBranchStatus(v);
  const statusOptions =
    activeTab === "agent" ? AGENT_STATUS_OPTIONS : BRANCH_STATUS_OPTIONS;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Tracking"
        description="Track Agent and Branch orders in real time as they move through the fulfillment journey."
        breadcrumbs={[
          { label: "Operations", href: "/orders" },
          { label: "Live Tracking" },
        ]}
        actions={
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/5 text-primary"
          >
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
            Live
            <span className="tabular-nums">
              {new Date(now).toLocaleTimeString()}
            </span>
          </Badge>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order no., customer, branch…"
              aria-label="Search orders"
              className="pl-8 pr-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={activeStatus} onValueChange={setActiveStatus}>
            <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {humanize(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="agent" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="agent">
            Agent Orders ({filteredAgentOrders.length})
          </TabsTrigger>
          <TabsTrigger value="branch">
            Branch Orders ({filteredBranchOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedAgentOrders.map((booking) => (
              <TrackingCard
                key={booking.id}
                href={`/bookings/track/${booking.id}`}
                reference={booking.reference}
                statusBadge={
                  <StatusBadge
                    variant={getStatusVariant(booking.status)}
                    label={humanize(booking.status)}
                  />
                }
                status={booking.status}
                adminId={booking.assignedAdminId}
                adminName={booking.assignedAdminName}
              >
                <p className="truncate font-medium text-foreground/80">
                  {booking.customerName}
                </p>
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {booking.branchName}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {relativeTime(booking.createdAt)}
                  {" · "}
                  {booking.items.length} item line
                  {booking.items.length === 1 ? "" : "s"}
                </p>
              </TrackingCard>
            ))}
          </div>
          {filteredAgentOrders.length === 0 && (
            <EmptyState
              icon={<Radio className="h-5 w-5" aria-hidden />}
              title="No agent orders match"
              description="Try a different search term or clear the status filter."
            />
          )}
        </TabsContent>

        <TabsContent value="branch">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedBranchOrders.map((order) => (
              <TrackingCard
                key={order.id}
                href={`/tracking/branch/${order.id}`}
                reference={order.reference}
                statusBadge={
                  <StatusBadge
                    variant={getStatusVariant(order.status)}
                    label={humanize(order.status)}
                  />
                }
                status={order.status}
                adminId={order.assignedAdminId}
                adminName={order.assignedAdminName}
              >
                <p className="flex items-center gap-1 font-medium text-foreground/80">
                  <MapPin className="h-3.5 w-3.5" />
                  {order.branchName}
                </p>
                <p className="flex flex-wrap items-center gap-1 text-xs">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {relativeTime(order.createdAt)}
                  {" · "}
                  {order.items.length} item line
                  {order.items.length === 1 ? "" : "s"}
                </p>
              </TrackingCard>
            ))}
          </div>
          {filteredBranchOrders.length === 0 && (
            <EmptyState
              icon={<Radio className="h-5 w-5" aria-hidden />}
              title="No branch orders match"
              description="Try a different search term or clear the status filter."
            />
          )}
        </TabsContent>
        {activeCount > pageSize && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {safePage * pageSize + 1}
              </span>–
              <span className="font-medium text-foreground">
                {Math.min(activeCount, safePage * pageSize + pageSize)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{activeCount}</span>
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    aria-disabled={safePage === 0}
                    className={safePage === 0 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={index === safePage}
                      onClick={() => setPage(index)}
                      aria-label={`Page ${index + 1}`}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    aria-disabled={safePage >= totalPages - 1}
                    className={
                      safePage >= totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Tabs>
    </div>
  );
}