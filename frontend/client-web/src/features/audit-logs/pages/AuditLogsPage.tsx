import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { mockAuditLogs } from "@/data/mock-audit-logs";
import type { AuditLog } from "@/types/audit";
import { formatDateTime, relativeTime } from "@/lib/utils";
import type { StatusVariant } from "@/lib/status";

/**
 * Maps an audit action to a status colour so the badge treatment matches
 * the rest of the app.
 */
function getActionVariant(action: string): StatusVariant {
  if (action === "Delete" || action === "Reject") return "destructive";
  if (action === "Create" || action === "Approve") return "success";
  if (action === "Update" || action === "Edit") return "warning";
  return "info";
}

export function AuditLogsPage() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [range, setRange] = useState<"all" | "today" | "7d" | "30d">("all");

  const modules = useMemo(
    () => Array.from(new Set(mockAuditLogs.map((l) => l.module))),
    []
  );
  const actions = useMemo(
    () => Array.from(new Set(mockAuditLogs.map((l) => l.action))),
    []
  );
  const users = useMemo(
    () => Array.from(new Set(mockAuditLogs.map((l) => l.userName))),
    []
  );

  const filtered = useMemo(
    () =>
      mockAuditLogs.filter((l) => {
        if (moduleFilter !== "all" && l.module !== moduleFilter) return false;
        if (actionFilter !== "all" && l.action !== actionFilter) return false;
        if (userFilter !== "all" && l.userName !== userFilter) return false;
        if (range !== "all") {
          const ageMs = Date.now() - new Date(l.timestamp).getTime();
          const maxAgeMs =
            range === "today"
              ? 24 * 60 * 60 * 1000
              : range === "7d"
                ? 7 * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000;
          if (ageMs > maxAgeMs) return false;
        }
        return true;
      }),
    [moduleFilter, actionFilter, userFilter, range]
  );

  const columns: DataTableColumn<AuditLog>[] = [
    {
      id: "user",
      header: "User",
      cell: (l) => (
        <div>
          <div className="text-sm font-medium">{l.userName}</div>
          <div className="text-xs text-muted-foreground">{l.userId}</div>
        </div>
      ),
      sortable: true,
      sortKey: "userName",
    },
    {
      id: "action",
      header: "Action",
      cell: (l) => (
        <StatusBadge
          variant={getActionVariant(l.action)}
          label={l.action}
        />
      ),
      sortable: true,
      sortKey: "action",
    },
    {
      id: "module",
      header: "Module",
      cell: (l) => (
        <span className="text-sm">{l.module}</span>
      ),
      className: "hidden md:table-cell",
    },
    {
      id: "description",
      header: "Description",
      cell: (l) => (
        <span
          className="line-clamp-1 block max-w-[420px] text-sm text-foreground"
          title={l.description}
        >
          {l.description}
          <span className="sr-only">. {l.description}</span>
        </span>
      ),
    },
    {
      id: "ip",
      header: "IP Address",
      cell: (l) => (
        <span className="font-mono text-xs">{l.ipAddress}</span>
      ),
      className: "hidden lg:table-cell",
    },
    {
      id: "timestamp",
      header: "When",
      cell: (l) => (
        <div className="text-xs">
          <div>{relativeTime(l.timestamp)}</div>
          <div className="text-muted-foreground">
            {formatDateTime(l.timestamp)}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "timestamp",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track all administrative actions across the system."
        breadcrumbs={[{ label: "Administration" }, { label: "Audit Logs" }]}
      />

      <DataTable<AuditLog>
        data={filtered}
        columns={columns}
        searchPlaceholder="Search logs…"
        searchKeys={["description", "userName", "ipAddress"]}
        rowKey={(l) => l.id}
        toolbar={
          <>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger aria-label="Filter by user" className="h-9 w-full sm:w-[160px]">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger aria-label="Filter by module" className="h-9 w-full sm:w-[150px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modules</SelectItem>
                {modules.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <SelectTrigger aria-label="Filter by date range" className="h-9 w-full sm:w-[140px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger aria-label="Filter by action" className="h-9 w-full sm:w-[140px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
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