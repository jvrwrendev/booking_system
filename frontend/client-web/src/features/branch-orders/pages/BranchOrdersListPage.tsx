import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, MoreHorizontal, ShoppingCart } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  getStatusVariant,
  humanize,
  ORDER_STATUS_OPTIONS,
} from "@/lib/status";
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
import type { BranchOrder } from "@/types/branch-order";
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
          variant={getStatusVariant(o.status)}
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
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={`Actions for ${o.reference}`}
            >
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
          </>
        }
        emptyState={
          <EmptyState
            icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
            title="No branch orders yet"
            description="Branch orders appear here as soon as they are created."
          />
        }
      />
    </div>
  );
}