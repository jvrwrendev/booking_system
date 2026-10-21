import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Eye, Mail, MoreHorizontal, Pencil, Phone } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
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
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";

import type { Branch } from "@/types/branch";
import { useBranchesStore } from "../hooks/useBranchesStore";
import { BranchEditDialog } from "../components/BranchEditDialog";
import { formatNumber } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function BranchesListPage() {
  const { can } = usePermissions();
  const { branches } = useBranchesStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Branch | null>(null);

  const filtered = useMemo(
    () =>
      branches.filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        return true;
      }),
    [branches, statusFilter]
  );

  const columns: DataTableColumn<Branch>[] = [
    {
      id: "name",
      header: "Branch",
      cell: (b) => (
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <Link
              to={`/branches/${b.id}`}
              className="text-sm font-medium hover:text-primary"
            >
              {b.name}
            </Link>
            <div className="font-mono text-xs text-muted-foreground">
              {b.code}
            </div>
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "name",
    },
    {
      id: "manager",
      header: "Manager",
      cell: (b) => (
        <div>
          <div className="text-sm">{b.manager || "—"}</div>
          <div className="text-xs text-muted-foreground">{b.email}</div>
        </div>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "contact",
      header: "Contact",
      cell: (b) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-muted-foreground" />
            {b.contactNumber}
          </div>
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="truncate">{b.email}</span>
          </div>
        </div>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "stats",
      header: "Stats",
      cell: (b) => (
        <div className="text-sm">
          <div className="font-medium">{formatNumber(b.totalStock)} units</div>
          <div className="text-xs text-muted-foreground">
            {b.totalProducts} products
          </div>
        </div>
      ),
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
              aria-label={`Actions for ${b.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/branches/${b.id}`}>
                <Eye className="h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            {can("branches.manage") && (
              <DropdownMenuItem onSelect={() => setEditing(b)}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
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
        title="Branches"
        description="Branches across the Philippines and their locations."
        breadcrumbs={[{ label: "People" }, { label: "Branches" }]}
      />

      <DataTable<Branch>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search branches..."
        searchKeys={["name", "code", "manager", "address", "email"]}
        rowKey={(b) => b.id}
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

      <BranchEditDialog
        branch={editing}
        onOpenChange={(o) => !o && setEditing(null)}
      />
    </div>
  );
}
