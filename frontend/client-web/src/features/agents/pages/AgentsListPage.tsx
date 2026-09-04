import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Pencil, Phone, Plus } from "lucide-react";

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

import type { Agent } from "@/types/agent";
import { useAgentsStore } from "../hooks/useAgentsStore";
import { formatDate, initials } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function AgentsListPage() {
  const { can } = usePermissions();
  const navigate = useNavigate();
  const { agents } = useAgentsStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(
    () =>
      agents.filter((a) => {
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        return true;
      }),
    [agents, statusFilter]
  );

  const columns: DataTableColumn<Agent>[] = [
    {
      id: "fullName",
      header: "Agent",
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(a.fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              to={`/agents/${a.id}`}
              className="text-sm font-medium hover:text-primary"
            >
              {a.fullName}
            </Link>
            <div className="text-xs text-muted-foreground">{a.email}</div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "fullName",
    },
    {
      id: "contact",
      header: "Contact",
      cell: (a) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          {a.contactNumber || "—"}
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "address",
      header: "Address",
      cell: (a) => (
        <span className="line-clamp-1 max-w-[240px] text-xs">
          {a.address || "—"}
        </span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "bookings",
      header: "Bookings",
      cell: (a) => <span className="font-medium">{a.totalBookings}</span>,
      sortable: true,
      sortKey: "totalBookings",
    },
    {
      id: "status",
      header: "Status",
      cell: (a) => (
        <StatusBadge
          variant={getStatusVariantFromGeneric(a.status)}
          label={humanize(a.status)}
        />
      ),
    },
    {
      id: "joined",
      header: "Date Joined",
      cell: (a) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(a.dateJoined)}
        </span>
      ),
      sortable: true,
      sortKey: "dateJoined",
      className: "hidden md:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-12",
      cell: (a) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/agents/${a.id}`}>
                <Eye className="h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            {can("agents.manage") && (
              <DropdownMenuItem asChild>
                <Link to={`/agents/${a.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>
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
        title="Agents"
        description="Sales agents who handle bookings and customer relationships."
        breadcrumbs={[{ label: "People" }, { label: "Agents" }]}
        actions={
          can("agents.manage") && (
            <Button onClick={() => navigate("/agents/add")}>
              <Plus className="h-4 w-4" />
              Add Agent
            </Button>
          )
        }
      />

      <DataTable<Agent>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search agents..."
        searchKeys={["fullName", "email", "contactNumber", "address"]}
        rowKey={(a) => a.id}
        toolbar={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
