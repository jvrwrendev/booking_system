import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, Eye, Filter, ShoppingCart, Store, User } from "lucide-react";
import { endOfMonth, endOfWeek, endOfYear, format, startOfMonth, startOfWeek, startOfYear } from "date-fns";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { AssignedAdminCell } from "@/components/common/AssignedAdminCell";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  getStatusVariant,
  humanize,
  ORDER_STATUS_OPTIONS,
} from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMyOrders } from "../hooks/useMyOrders";
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { useBranchOrdersStore } from "@/features/branch-orders/hooks/useBranchOrdersStore";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

import { mockBranches } from "@/data/mock-branches";
import { Booking } from "@/types/booking";
import { BranchOrder } from "@/types/branch-order";
import { formatCurrency, formatDate } from "@/lib/utils";



type DatePreset = "all" | "today" | "week" | "month" | "year";

const DATE_PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

function withinPreset(dateStr: string, preset: DatePreset): boolean {
  if (preset === "all") return true;
  const now = new Date();
  const iso = (d: Date) => format(d, "yyyy-MM-dd");
  switch (preset) {
    case "today":
      return dateStr === iso(now);
    case "week": {
      const start = iso(startOfWeek(now, { weekStartsOn: 1 }));
      const end = iso(endOfWeek(now, { weekStartsOn: 1 }));
      return dateStr >= start && dateStr <= end;
    }
    case "month": {
      const start = iso(startOfMonth(now));
      const end = iso(endOfMonth(now));
      return dateStr >= start && dateStr <= end;
    }
    case "year": {
      const start = iso(startOfYear(now));
      const end = iso(endOfYear(now));
      return dateStr >= start && dateStr <= end;
    }
  }
}

function branchManager(branchId?: string | null): string {
  if (!branchId) return "—";
  const branch = mockBranches.find((br) => br.id === branchId);
  return branch?.manager ?? "—";
}

export function OrdersPage() {
  const { user } = useAuth();
  const { isSuperAdmin } = usePermissions();
  const { bookings } = useBookingsStore();
  const { orders } = useBranchOrdersStore();
  const { myAgentOrders, myBranchOrders } = useMyOrders();
  const [agentStatus, setAgentStatus] = useState("all");
  const [branchStatus, setBranchStatus] = useState("all");
  const [agentDate, setAgentDate] = useState<DatePreset>("all");
  const [branchDate, setBranchDate] = useState<DatePreset>("all");

  const agentSource = isSuperAdmin ? bookings : myAgentOrders;
  const branchSource = isSuperAdmin ? orders : myBranchOrders;

  const filteredAgentOrders = useMemo(
    () =>
      agentSource
        .filter((b) => b.status !== "completed")
        .filter((b) => agentStatus === "all" || b.status === agentStatus)
        .filter((b) => withinPreset(b.bookingDate, agentDate))
        .slice()
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)),
    [agentSource, agentStatus, agentDate]
  );

  const filteredBranchOrders = useMemo(
    () =>
      branchSource
        .filter((o) => o.status !== "completed")
        .filter((o) => branchStatus === "all" || o.status === branchStatus)
        .filter((o) => withinPreset(o.orderDate, branchDate))
        .slice()
        .sort((a, b) => b.orderDate.localeCompare(a.orderDate)),
    [branchSource, branchStatus, branchDate]
  );

  const agentColumns: DataTableColumn<Booking>[] = [
    {
      id: "reference",
      header: "Order No.",
      cell: (b) => (
        <Link
          to={`/orders/agent/${b.id}`}
          className="font-mono text-xs font-medium hover:text-primary"
        >
          {b.reference}
        </Link>
      ),
      sortable: true,
      sortKey: "reference",
    },
    {
      id: "customer",
      header: "Customer",
      cell: (b) => <span className="text-sm">{b.customerName}</span>,
      sortable: true,
      sortKey: "customerName",
    },
    {
      id: "agent",
      header: "Agent",
      cell: (b) => <span className="text-sm">{b.agentName}</span>,
      sortable: true,
      sortKey: "agentName",
      hideOnMobile: true,
    },
    {
      id: "branchManager",
      header: "Branch Manager",
      cell: (b) => <span className="text-sm">{branchManager(b.branchId)}</span>,
      hideOnMobile: true,
    },
    {
      id: "items",
      header: "Items",
      className: "text-right",
      cell: (b) => (
        <span className="text-sm font-medium">
          {b.items.length} item{b.items.length > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Total Amount",
      cell: (b) => (
        <span className="font-medium">{formatCurrency(b.totalAmount)}</span>
      ),
      sortable: true,
      sortKey: "totalAmount",
    },
    {
      id: "status",
      header: "Status",
      cell: (b) => (
        <StatusBadge
          variant={getStatusVariant(b.status)}
          label={humanize(b.status)}
        />
      ),
    },
    {
      id: "assigned",
      header: "Assigned Admin",
      cell: (b) => (
        <AssignedAdminCell
          adminId={b.assignedAdminId}
          adminName={b.assignedAdminName}
        />
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "date",
      header: "Order Date",
      cell: (b) => <span className="text-sm">{formatDate(b.bookingDate)}</span>,
      sortable: true,
      sortKey: "bookingDate",
      hideOnMobile: true,
    },
    {
      id: "actions",
      header: "Action",
      className: "w-20 text-center",
      cell: (b) => (
        <Button asChild variant="ghost" size="sm">
          <Link to={`/orders/agent/${b.id}`}>
            <Eye className="h-4 w-4" />
            View
          </Link>
        </Button>
      ),
    },
  ];

  const branchColumns: DataTableColumn<BranchOrder>[] = [
    {
      id: "reference",
      header: "Order No.",
      cell: (o) => (
        <Link
          to={`/orders/branch/${o.id}`}
          className="font-mono text-xs font-medium hover:text-primary"
        >
          {o.reference}
        </Link>
      ),
      sortable: true,
      sortKey: "reference",
    },
    {
      id: "branch",
      header: "Branch",
      cell: (o) => <span className="text-sm">{o.branchName}</span>,
      sortable: true,
      sortKey: "branchName",
    },
    {
      id: "branchManager",
      header: "Branch Manager",
      cell: (o) => <span className="text-sm">{branchManager(o.branchId)}</span>,
      hideOnMobile: true,
    },
    {
      id: "items",
      header: "Items",
      className: "text-right",
      cell: (o) => (
        <span className="text-sm font-medium">
          {o.items.length} item{o.items.length > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      id: "amount",
      header: "Total Amount",
      cell: (o) => (
        <span className="font-medium">{formatCurrency(o.totalAmount)}</span>
      ),
      sortable: true,
      sortKey: "totalAmount",
    },
    {
      id: "status",
      header: "Status",
      cell: (o) => (
        <StatusBadge
          variant={getStatusVariant(o.status)}
          label={humanize(o.status)}
        />
      ),
    },
    {
      id: "assigned",
      header: "Assigned Admin",
      cell: (o) => (
        <AssignedAdminCell
          adminId={o.assignedAdminId}
          adminName={o.assignedAdminName}
        />
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "date",
      header: "Order Date",
      cell: (o) => <span className="text-sm">{formatDate(o.orderDate)}</span>,
      sortable: true,
      sortKey: "orderDate",
      hideOnMobile: true,
    },
    {
      id: "actions",
      header: "Action",
      className: "w-20 text-center",
      cell: (o) => (
        <Button asChild variant="ghost" size="sm">
          <Link to={`/orders/branch/${o.id}`}>
            <Eye className="h-4 w-4" />
            View
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={
          isSuperAdmin
            ? "Review agent and branch orders, accept or reject them, and assign accepted orders to admins."
            : `Orders assigned to ${user?.fullName ?? "you"} for processing.`
        }
        breadcrumbs={[{ label: "Operations" }, { label: "Orders" }]}
      />

      <Tabs defaultValue="agent">
        <TabsList>
          <TabsTrigger value="agent" className="gap-2">
            <User className="h-4 w-4" />
            Agent Orders
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {filteredAgentOrders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="branch" className="gap-2">
            <Store className="h-4 w-4" />
            Branch Orders
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
              {filteredBranchOrders.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-4">
          <DataTable<Booking>
            data={filteredAgentOrders}
            columns={agentColumns}
            searchPlaceholder="Search by order no., customer, agent..."
            searchKeys={["reference", "customerName", "agentName"]}
            rowKey={(b) => b.id}
            toolbar={
              <>
                <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select value={agentStatus} onValueChange={setAgentStatus}>
                  <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
{ORDER_STATUS_OPTIONS.map((option) => (
  <SelectItem key={option.value} value={option.value}>
    {option.label}
  </SelectItem>
))}
                  </SelectContent>
                </Select>
                <CalendarRange className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select
                  value={agentDate}
                  onValueChange={(v) => setAgentDate(v as DatePreset)}
                >
                  <SelectTrigger aria-label="Filter by date" className="h-9 w-full sm:w-[130px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            emptyState={
              <EmptyState
                icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
                title={
                  isSuperAdmin
                    ? "No agent orders yet"
                    : "No agent orders assigned to you"
                }
                description={
                  isSuperAdmin
                    ? "Agent orders appear here as soon as they are created."
                    : "Bookings assigned to you will show up here."
                }
              />
            }
          />
        </TabsContent>

        <TabsContent value="branch" className="space-y-4">
          <DataTable<BranchOrder>
            data={filteredBranchOrders}
            columns={branchColumns}
            searchPlaceholder="Search by order no., branch..."
            searchKeys={["reference", "branchName"]}
            rowKey={(o) => o.id}
            toolbar={
              <>
                <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select value={branchStatus} onValueChange={setBranchStatus}>
                  <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
{ORDER_STATUS_OPTIONS.map((option) => (
  <SelectItem key={option.value} value={option.value}>
    {option.label}
  </SelectItem>
))}
                  </SelectContent>
                </Select>
                <CalendarRange className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select
                  value={branchDate}
                  onValueChange={(v) => setBranchDate(v as DatePreset)}
                >
                  <SelectTrigger aria-label="Filter by date" className="h-9 w-full sm:w-[130px]">
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESET_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            emptyState={
              <EmptyState
                icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
                title={
                  isSuperAdmin
                    ? "No branch orders yet"
                    : "No branch orders assigned to you"
                }
                description={
                  isSuperAdmin
                    ? "Branch orders appear here as soon as they are created."
                    : "Branch orders assigned to you will show up here."
                }
              />
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}