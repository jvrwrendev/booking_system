import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, MoreHorizontal, Route } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { AssignedAdminCell } from "@/components/common/AssignedAdminCell";
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

import { useBookingList } from "../hooks/useBookingList";
import { useBookingLookups } from "../hooks/useBookingLookups";
import type { Booking } from "@/types/booking";
import { formatCurrency, formatDate } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

type AssignmentFilter = "all" | "assigned" | "unassigned";

export function BookingsListPage() {
  const { can } = usePermissions();
  const { branches, agents } = useBookingLookups();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] =
    useState<AssignmentFilter>("all");

  const canAssign = can("bookings.assign");
  const isSuperAdmin = canAssign;

  const {
    bookings,
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
  } = useBookingList(
    {
      status: statusFilter,
      branchId: branchFilter,
      agentId: agentFilter,
      assignment: assignedFilter === "all" ? undefined : assignedFilter,
    },
    10,
  );

  const columns: DataTableColumn<Booking>[] = [
    {
      id: "reference",
      header: "Booking No.",
      cell: (b) => (
        <Link
          to={`/bookings/${b.id}`}
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
      cell: (b) => (
        <div className="text-sm font-medium">{b.customerName}</div>
      ),
      sortable: true,
      sortKey: "customerName",
    },
    {
      id: "agent",
      header: "Agent",
      cell: (b) => <span className="text-sm">{b.agentName}</span>,
      sortable: true,
      sortKey: "agentName",
    },
    {
      id: "items",
      header: "Items",
      cell: (b) => <span className="text-sm font-medium">{b.items.length}</span>,
      className: "text-right",
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
      id: "date",
      header: "Booking Date",
      cell: (b) => (
        <div className="text-sm">
          <div>{formatDate(b.bookingDate)}</div>
          <div className="text-xs text-muted-foreground">
            Pickup {formatDate(b.pickupDate)}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "bookingDate",
      className: "hidden md:table-cell",
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
      id: "actions",
      header: "Action",
      className: "w-16 text-center",
      cell: (b) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={`Actions for ${b.reference}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/bookings/${b.id}`}>
                <Eye className="h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/bookings/track/${b.id}`}>
                <Route className="h-4 w-4" />
                Track
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
        title="Bookings"
        description={
          isSuperAdmin
            ? "Manage, assign, and track customer bookings across all branches."
            : "View all bookings across all branches."
        }
        breadcrumbs={[{ label: "Operations" }, { label: "Bookings" }]}
      />

      <DataTable<Booking>
        data={bookings}
        columns={columns}
        searchPlaceholder="Search by reference, customer..."
        rowKey={(b) => b.id}
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                aria-label="Filter by status"
                className="h-9 w-full sm:w-[150px]"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ORDER_STATUS_OPTIONS.filter(
                  (option) => option.value !== "all",
                ).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger
                aria-label="Filter by branch"
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
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger
                aria-label="Filter by agent"
                className="h-9 w-full sm:w-[160px]"
              >
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {agents
                  .filter((agent) => agent.agentId)
                  .map((agent) => (
                    <SelectItem
                      key={agent.id}
                      value={agent.agentId ?? agent.id}
                    >
                      {agent.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {isSuperAdmin && (
              <Select
                value={assignedFilter}
                onValueChange={(value) =>
                  setAssignedFilter(value as AssignmentFilter)
                }
              >
                <SelectTrigger
                  aria-label="Filter by assignment"
                  className="h-9 w-full sm:w-[160px]"
                >
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All assignments</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            )}
          </>
        }
      />
    </div>
  );
}
