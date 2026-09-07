import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, User, Store } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import {
  StatusBadge,
  getBookingStatusVariant,
  getBranchOrderStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useMyOrders } from "../hooks/useMyOrders";
import { useAuth } from "@/hooks/useAuth";
import type { Booking, BookingStatus } from "@/types/booking";
import type { BranchOrder, BranchOrderStatus } from "@/types/branch-order";
import { formatCurrency, formatDate } from "@/lib/utils";

const BRANCH_STATUS_OPTIONS: BranchOrderStatus[] = [
  "assigned",
  "accepted",
  "processing",
  "ready",
  "completed",
  "rejected",
];

export function OrdersPage() {
  const { user } = useAuth();
  const { myAgentOrders, myBranchOrders } = useMyOrders();
  const [agentStatus, setAgentStatus] = useState("all");
  const [branchStatus, setBranchStatus] = useState("all");

  const filteredAgentOrders = useMemo(
    () =>
      myAgentOrders
        .filter((b) => agentStatus === "all" || b.status === agentStatus)
        .slice()
        .sort((a, b) => b.bookingDate.localeCompare(a.bookingDate)),
    [myAgentOrders, agentStatus]
  );

  const filteredBranchOrders = useMemo(
    () =>
      myBranchOrders
        .filter((o) => branchStatus === "all" || o.status === branchStatus)
        .slice()
        .sort((a, b) => b.orderDate.localeCompare(a.orderDate)),
    [myBranchOrders, branchStatus]
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
          variant={getBookingStatusVariant(b.status)}
          label={humanize(b.status)}
        />
      ),
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
          variant={getBranchOrderStatusVariant(o.status)}
          label={humanize(o.status)}
        />
      ),
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
        description={`Orders assigned to ${user?.fullName ?? "you"} for processing.`}
        breadcrumbs={[{ label: "Operations" }, { label: "Orders" }]}
      />

      <Tabs defaultValue="agent">
        <TabsList>
          <TabsTrigger value="agent" className="gap-2">
            <User className="h-4 w-4" />
            Agent Orders
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
              {filteredAgentOrders.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="branch" className="gap-2">
            <Store className="h-4 w-4" />
            Branch Orders
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
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
                  <SelectTrigger className="h-9 w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {(
                      [
                        "assigned",
                        "accepted",
                        "confirmed",
                        "processing",
                        "ready",
                        "completed",
                        "cancelled",
                        "rejected",
                      ] as BookingStatus[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {humanize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            emptyState={
              <div className="py-10 text-center text-sm text-muted-foreground">
                No agent orders assigned to you yet.
              </div>
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
                  <SelectTrigger className="h-9 w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {BRANCH_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {humanize(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            emptyState={
              <div className="py-10 text-center text-sm text-muted-foreground">
                No branch orders assigned to you yet.
              </div>
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}