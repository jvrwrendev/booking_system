import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, MoreHorizontal } from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { AssignedAdminCell } from "@/components/common/AssignedAdminCell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranchOrderList } from "@/features/branch-orders/hooks/useBranchOrderList";
import { getStatusVariant, humanize } from "@/lib/status";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { BranchOrder } from "@/types/branch-order";
import { useBookingLookups } from "../hooks/useBookingLookups";

export function CompletedBranchOrdersTable() {
  const { branches } = useBookingLookups();
  const [branchFilter, setBranchFilter] = useState("all");
  const {
    branchOrders,
    total,
    loading,
    error,
    refresh,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
  } = useBranchOrderList(
    { status: "completed", branchId: branchFilter },
    10,
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
      id: "customer",
      header: "Customer",
      cell: () => (
        <span className="text-sm text-muted-foreground" aria-label="No customer">
          —
        </span>
      ),
    },
    {
      id: "agent",
      header: "Agent",
      cell: () => (
        <span className="text-sm text-muted-foreground" aria-label="No agent">
          —
        </span>
      ),
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
    <DataTable<BranchOrder>
      data={branchOrders}
      columns={columns}
      searchPlaceholder="Search by order no., branch..."
      rowKey={(o) => o.id}
      loading={loading}
      error={error}
      onRetry={refresh}
      serverMode={{
        search: searchInput,
        onSearchChange: setSearchInput,
        page,
        pageSize,
        total,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }}
      toolbar={
        <>
          <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger
              aria-label="Filter completed branch orders by branch"
              className="h-9 w-full sm:w-[170px]"
            >
              <SelectValue placeholder="Branch" />
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
        </>
      }
    />
  );
}
