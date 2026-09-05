import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Filter, History } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import { useBookingsStore } from "../hooks/useBookingsStore";
import { mockBranches } from "@/data/mock-branches";
import { mockUsers } from "@/data/mock-users";
import { formatCurrency, formatDate, formatDateTime, initials } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { Booking, BookingStatus } from "@/types/booking";

export function BookingHistoryPage() {
  const { user } = useAuth();
  const { bookings } = useBookingsStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "mine">("mine");

  const admins = useMemo(
    () => mockUsers.filter((u) => u.role === "ADMIN"),
    []
  );

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (scope === "mine") {
        if (b.assignedAdminId !== user?.id) return false;
      }
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (branchFilter !== "all" && b.branchId !== branchFilter) return false;
      if (adminFilter !== "all" && b.assignedAdminId !== adminFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, branchFilter, adminFilter, scope, user?.id]);

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
        <div className="text-sm font-medium">{b.customerName}</div>
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
      id: "assignedAdmin",
      header: "Assigned Admin",
      cell: (b) => {
        if (b.assignedAdminName) {
          return (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px]">
                  {initials(b.assignedAdminName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{b.assignedAdminName}</span>
            </div>
          );
        }
        return (
          <Badge variant="muted" className="text-[10px]">
            Unassigned
          </Badge>
        );
      },
    },
    {
      id: "bookingDate",
      header: "Booking Date",
      cell: (b) => (
        <span className="text-sm">{formatDate(b.bookingDate)}</span>
      ),
      sortable: true,
      sortKey: "bookingDate",
      className: "hidden md:table-cell",
    },
    {
      id: "amount",
      header: "Total",
      cell: (b) => (
        <span className="font-medium">{formatCurrency(b.totalAmount)}</span>
      ),
      sortable: true,
      sortKey: "totalAmount",
      className: "hidden md:table-cell",
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
      id: "lastUpdated",
      header: "Last Updated",
      cell: (b) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(b.assignmentDate ?? b.createdAt)}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "completedDate",
      header: "Completed",
      cell: (b) => {
        if (b.status === "completed") {
          return (
            <span className="text-xs text-muted-foreground">
              {formatDateTime(b.assignmentDate ?? b.createdAt)}
            </span>
          );
        }
        return <span className="text-xs text-muted-foreground">—</span>;
      },
      className: "hidden lg:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (b) => (
        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
          <Link to={`/bookings/${b.id}`} aria-label="View booking">
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking History"
        description="Complete booking history with assignment and processing details."
        breadcrumbs={[
          { label: "Operations" },
          { label: "Bookings", href: "/bookings" },
          { label: "History" },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/bookings">
              <History className="h-4 w-4" />
              Back to bookings
            </Link>
          </Button>
        }
      />

      <DataTable<Booking>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by reference, customer, admin..."
        searchKeys={[
          "reference",
          "customerName",
          "assignedAdminName",
          "branchName",
        ]}
        rowKey={(b) => b.id}
        toolbar={
          <>
            <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
            <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="Scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">My assignments</SelectItem>
                <SelectItem value="all">All bookings</SelectItem>
              </SelectContent>
            </Select>
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
            <Select value={adminFilter} onValueChange={setAdminFilter}>
              <SelectTrigger className="h-9 w-[170px]">
                <SelectValue placeholder="Admin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All admins</SelectItem>
                {admins.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />
    </div>
  );
}
