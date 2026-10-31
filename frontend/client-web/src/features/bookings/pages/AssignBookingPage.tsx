import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useBookingList } from "../hooks/useBookingList";
import { useBookingLookups } from "../hooks/useBookingLookups";
import { AssignmentDialog } from "../components/AssignmentDialog";
import type { Booking } from "@/types/booking";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useBookingsStore } from "../hooks/useBookingsStore";

type AssignmentFilter = "all" | "assigned" | "unassigned";

const TERMINAL_FOR_ASSIGNMENT = new Set<Booking["status"]>([
  "completed",
  "ready_for_delivery",
  "cancelled",
  "rejected",
]);

function canAssignBooking(booking: Booking): boolean {
  return (
    !TERMINAL_FOR_ASSIGNMENT.has(booking.status) &&
    (Boolean(booking.assignedAdminId) || booking.status === "accepted")
  );
}

export function AssignBookingPage() {
  const { user } = useAuth();
  const { assignBooking, reassignBooking } = useBookingsStore();
  const { branches, agents, admins } = useBookingLookups(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] =
    useState<AssignmentFilter>("all");
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);

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
      header: "Reference",
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
        <div>
          <div className="text-sm font-medium">{b.customerName}</div>
          <div className="text-xs text-muted-foreground">
            {b.items.length} item{b.items.length > 1 ? "s" : ""}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "customerName",
    },
    {
      id: "branch",
      header: "Branch",
      cell: (b) => (
        <span className="text-sm">{b.branchName.replace(" Branch", "")}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "agent",
      header: "Agent",
      cell: (b) => <span className="text-sm">{b.agentName}</span>,
      className: "hidden lg:table-cell",
    },
    {
      id: "assigned",
      header: "Assigned To",
      cell: (b) => {
        if (b.assignedAdminId && b.assignedAdminName) {
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {initials(b.assignedAdminName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">
                  {b.assignedAdminName}
                </div>
                {b.assignmentDate && (
                  <div className="text-xs text-muted-foreground">
                    {formatDate(b.assignmentDate)}
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <Badge variant="muted" className="text-xs">
            Unassigned
          </Badge>
        );
      },
      className: "hidden md:table-cell",
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
      id: "amount",
      header: "Amount",
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
      id: "actions",
      header: "",
      className: "w-12",
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
                View details
              </Link>
            </DropdownMenuItem>
            {canAssignBooking(b) && (
              <DropdownMenuItem onSelect={() => setAssignTarget(b)}>
                {b.assignedAdminId ? (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Reassign admin
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Assign to admin
                  </>
                )}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Booking"
        description="Assign or reassign bookings to admins across all branches."
        breadcrumbs={[{ label: "Operations" }, { label: "Assign Booking" }]}
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
          </>
        }
      />

      {assignTarget && user && (
        <AssignmentDialog
          open={!!assignTarget}
          onOpenChange={(o) => !o && setAssignTarget(null)}
          target={{
            reference: assignTarget.reference,
            details: `${assignTarget.customerName} · ${assignTarget.branchName}`,
            assignedAdminId: assignTarget.assignedAdminId,
            assignedAdminName: assignTarget.assignedAdminName,
            assignedByName: assignTarget.assignedByName,
            assignmentDate: assignTarget.assignmentDate,
          }}
          admins={admins}
          currentUser={user}
          onAssign={(admin, by) => {
            if (assignTarget.assignedAdminId) {
              void reassignBooking(assignTarget.id, admin, by).then(refresh);
            } else {
              void assignBooking(assignTarget.id, admin, by).then(refresh);
            }
            setAssignTarget(null);
          }}
        />
      )}
    </div>
  );
}
