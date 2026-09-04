import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
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

export function AuditLogsPage() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");

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
        return true;
      }),
    [moduleFilter, actionFilter, userFilter]
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
        <Badge
          variant={
            l.action === "Delete" || l.action === "Reject"
              ? "destructive"
              : l.action === "Create" || l.action === "Approve"
              ? "success"
              : "info"
          }
        >
          {l.action}
        </Badge>
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
        <span className="line-clamp-1 max-w-[420px] text-sm" title={l.description}>
          {l.description}
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
        searchPlaceholder="Search logs..."
        searchKeys={["description", "userName", "ipAddress"]}
        rowKey={(l) => l.id}
        toolbar={
          <>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="h-9 w-[160px]">
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
              <SelectTrigger className="h-9 w-[150px]">
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
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="h-9 w-[140px]">
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