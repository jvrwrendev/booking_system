import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, MoreHorizontal } from "lucide-react";

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useBookingsStore } from "../hooks/useBookingsStore";
import type { Booking, BookingStatus } from "@/types/booking";
import { mockBranches } from "@/data/mock-branches";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

export function MyAssignedBookingsPage() {
  const { user } = useAuth();
  const { bookings } = useBookingsStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const myBookings = useMemo(
    () =>
      bookings.filter(
        (b) => !!b.assignedAdminId && b.assignedAdminId === user?.id
      ),
    [bookings, user?.id]
  );

  const filtered = useMemo(
    () =>
      myBookings.filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (branchFilter !== "all" && b.branchId !== branchFilter) return false;
        return true;
      }),
    [myBookings, statusFilter, branchFilter]
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
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assigned Bookings"
        description={`Bookings assigned to ${user?.fullName ?? "you"} for processing.`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "My Assigned Bookings" },
        ]}
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
          </>
        }
        emptyState={
          <div className="py-10 text-center text-sm text-muted-foreground">
            No assigned bookings yet.
          </div>
        }
      />
    </div>
  );
}