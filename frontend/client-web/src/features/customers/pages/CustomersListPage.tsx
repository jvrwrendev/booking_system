import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Mail, MapPin, MoreHorizontal, Pencil, Phone, Plus } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
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
import { CustomerAddDialog } from "../components/CustomerAddDialog";
import { CustomerEditDialog } from "../components/CustomerEditDialog";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function CustomersListPage() {
  const { can } = usePermissions();
  const { customers, toggleStatus } = useCustomersStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Customer | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);

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
          <div className="text-xs text-muted-foreground">
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
          variant={getStatusVariant(c.status)}
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
            <Button
              variant="ghost"
              size="iconSm"
              aria-label={`Actions for ${c.fullName}`}
            >
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
              <DropdownMenuItem onSelect={() => setEditing(c)}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit customer
              </DropdownMenuItem>
            )}
            {can("customers.manage") && (
              <DropdownMenuItem onSelect={() => setStatusTarget(c)}>
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
            <Button onClick={() => setAddOpen(true)}>
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
            <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-[140px]">
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

      <CustomerAddDialog open={addOpen} onOpenChange={setAddOpen} />

      <CustomerEditDialog
        customer={editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onOpenChange={(o) => !o && setStatusTarget(null)}
        title={
          statusTarget?.status === "active"
            ? "Deactivate this customer?"
            : "Activate this customer?"
        }
        description={
          statusTarget?.status === "active"
            ? `${statusTarget.fullName} will no longer be able to sign in or place bookings.`
            : `${statusTarget?.fullName ?? "This customer"} will be able to sign in and place bookings again.`
        }
        confirmText={
          statusTarget?.status === "active" ? "Deactivate" : "Activate"
        }
        destructive={statusTarget?.status === "active"}
        onConfirm={async () => {
          if (!statusTarget) return;
          const target = statusTarget;
          setStatusTarget(null);
          await toggleStatus(
            target.id,
            target.status === "active" ? "inactive" : "active"
          );
        }}
      />
    </div>
  );
}
