import { useMemo, useState } from "react";
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
import {
  StatusBadge,
  getBookingStatusVariant,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { useBookingsStore } from "../hooks/useBookingsStore";
import { AssignmentDialog } from "../components/AssignmentDialog";
import type { Booking, BookingStatus } from "@/types/booking";
import { mockBranches } from "@/data/mock-branches";
import { mockAgents } from "@/data/mock-agents";
import { mockUsers } from "@/data/mock-users";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function AssignBookingPage() {
  const { user } = useAuth();
  const { bookings, assignBooking, reassignBooking } = useBookingsStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);

  const filtered = useMemo(
    () =>
      bookings.filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (branchFilter !== "all" && b.branchId !== branchFilter) return false;
        if (agentFilter !== "all" && b.agentId !== agentFilter) return false;
        if (assignedFilter === "assigned" && !b.assignedAdminId) return false;
        if (assignedFilter === "unassigned" && b.assignedAdminId) return false;
        return true;
      }),
    [bookings, statusFilter, branchFilter, agentFilter, assignedFilter]
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
                  <div className="text-[10px] text-muted-foreground">
                    {formatDate(b.assignmentDate)}
                  </div>
                )}
              </div>
            </div>
          );
        }
        return (
          <Badge variant="muted" className="text-[10px]">
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
          <div className="text-[11px] text-muted-foreground">
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
          variant={getBookingStatusVariant(b.status)}
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
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
            {(b.assignedAdminId || b.status === "accepted") && (
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
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by reference, customer..."
        searchKeys={[
          "reference",
          "customerName",
          "agentName",
          "branchName",
          "assignedAdminName",
        ]}
        rowKey={(b) => b.id}
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
                    "assigned",
                    "pending",
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
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {mockBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {mockAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assignedFilter} onValueChange={setAssignedFilter}>
              <SelectTrigger className="h-9 w-[160px]">
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
          booking={assignTarget}
          admins={mockUsers}
          currentUser={user}
          onAssign={(admin, by) => {
            if (assignTarget.assignedAdminId) {
              reassignBooking(assignTarget.id, admin, by);
            } else {
              assignBooking(assignTarget.id, admin, by);
            }
          }}
        />
      )}
    </div>
  );
}