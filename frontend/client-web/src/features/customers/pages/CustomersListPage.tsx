import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Mail, MapPin, MoreHorizontal, Pencil, Phone, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import {
  StatusBadge,
  getStatusVariantFromGeneric,
  humanize,
} from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

import type { Customer } from "@/types/customer";
import { useCustomersStore } from "../hooks/useCustomersStore";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function CustomersListPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const { customers, toggleStatus } = useCustomersStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(
    () =>
      customers.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        return true;
      }),
    [customers, statusFilter]
  );

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "fullName",
      header: "Customer",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(c.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              to={`/customers/${c.id}`}
              className="text-sm font-medium hover:text-primary"
            >
              {c.fullName}
            </Link>
            <div className="text-xs text-muted-foreground">{c.email}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "fullName",
    },
    {
      id: "contact",
      header: "Contact",
      cell: (c) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {c.contactNumber || "—"}
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{c.email}</span>
          </div>
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "agent",
      header: "Assigned Agent",
      cell: (c) => (
        <Link
          to={`/agents/${c.assignedAgentId}`}
          className="text-sm text-primary hover:underline"
        >
          {c.assignedAgentName || "Unassigned"}
        </Link>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "address",
      header: "Address",
      cell: (c) => (
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="line-clamp-2 max-w-[220px]">{c.address || "—"}</span>
        </div>
      ),
      className: "hidden xl:table-cell",
    },
    {
      id: "bookings",
      header: "Bookings",
      cell: (c) => (
        <div className="text-sm">
          <div className="font-medium">{c.totalBookings}</div>
          <div className="text-[11px] text-muted-foreground">
            {formatCurrency(c.totalPurchases)}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "totalBookings",
    },
    {
      id: "status",
      header: "Status",
      cell: (c) => (
        <StatusBadge
          variant={getStatusVariantFromGeneric(c.status)}
          label={humanize(c.status)}
        />
      ),
    },
    {
      id: "registered",
      header: "Registered",
      cell: (c) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(c.registeredDate)}
        </span>
      ),
      sortable: true,
      sortKey: "registeredDate",
      className: "hidden md:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (c) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/customers/${c.id}`}>
                <Eye className="h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            {can("customers.manage") && (
              <DropdownMenuItem asChild>
                <Link to={`/customers/${c.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit customer
                </Link>
              </DropdownMenuItem>
            )}
            {can("customers.manage") && (
              <DropdownMenuItem
                onSelect={() =>
                  toggleStatus(
                    c.id,
                    c.status === "active" ? "inactive" : "active"
                  )
                }
              >
                {c.status === "active" ? "Deactivate" : "Activate"}
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
        title="Customers"
        description="Manage your customer records and their purchase history."
        breadcrumbs={[{ label: "People" }, { label: "Customers" }]}
        actions={
          can("customers.manage") && (
            <Button onClick={() => navigate("/customers/add")}>
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          )
        }
      />

      <DataTable<Customer>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search customers..."
        searchKeys={["fullName", "email", "contactNumber", "address"]}
        rowKey={(c) => c.id}
        toolbar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
