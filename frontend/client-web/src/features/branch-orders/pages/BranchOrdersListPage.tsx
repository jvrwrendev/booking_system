import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, MoreHorizontal } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import {
  StatusBadge,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useBranchOrdersStore } from "../hooks/useBranchOrdersStore";
import type { BranchOrder, BranchOrderStatus } from "@/types/branch-order";
import { formatCurrency, formatDate } from "@/lib/utils";

export function BranchOrdersListPage() {
  const { orders } = useBranchOrdersStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (statusFilter !== "all" && o.status !== statusFilter) return false;
        return true;
      }),
    [orders, statusFilter]
  );

  const columns: DataTableColumn<BranchOrder>[] = [
    {
      id: "reference",
      header: "Order No.",
      cell: (o) => (
        <Link
          to={`/branch-orders/${o.id}`}
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
      cell: (o) => <span className="text-sm font-medium">{o.items.length}</span>,
      className: "text-right",
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
      className: "hidden md:table-cell",
    },
    {
      id: "actions",
      header: "Action",
      className: "w-16 text-center",
      cell: (o) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/branch-orders/${o.id}`}>
                <Eye className="h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch Orders"
        description="Orders submitted by branches for approval and fulfillment."
        breadcrumbs={[{ label: "Operations" }, { label: "Branch Orders" }]}
      />

      <DataTable<BranchOrder>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by order no., branch..."
        searchKeys={["reference", "branchName"]}
        rowKey={(o) => o.id}
        toolbar={
          <>
            <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(
                  [
                    "pending",
                    "accepted",
                    "assigned",
                    "admin_accepted",
                    "processing",
                    "ready",
                    "completed",
                    "ready_for_delivery",
                    "rejected",
                  ] as BranchOrderStatus[]
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
            No branch orders yet.
          </div>
        }
      />
    </div>
  );
}