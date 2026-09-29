import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PAGE_SIZE_DEFAULT } from "@/lib/constants";

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: keyof T | string;
  className?: string;
  hideOnMobile?: boolean;
}

/**
 * Opt-in server-driven mode. When supplied, the table stops filtering,
 * sorting, and slicing locally and defers entirely to the parent — the API
 * owns those concerns and exposes no `sort` parameter.
 *
 * Leave it undefined to keep the default in-memory behaviour.
 */
export interface DataTableServerMode {
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  toolbar?: ReactNode;
  emptyState?: ReactNode;
  loading?: boolean;
  pageSize?: number;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  globalActions?: ReactNode;
  showSearch?: boolean;
  serverMode?: DataTableServerMode;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchKeys,
  toolbar,
  emptyState,
  loading = false,
  pageSize: initialPageSize = PAGE_SIZE_DEFAULT,
  rowKey,
  onRowClick,
  globalActions,
  showSearch = true,
  serverMode,
}: DataTableProps<T>) {
  const isServer = Boolean(serverMode);
  const [search, setSearch] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sort, setSort] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const filtered = useMemo(() => {
    if (isServer) return data;
    if (!search || !searchKeys || searchKeys.length === 0) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const value = (row as Record<string, unknown>)[key as string];
        return value != null && String(value).toLowerCase().includes(lower);
      })
    );
  }, [data, search, searchKeys, isServer]);

  const sorted = useMemo(() => {
    if (isServer) return filtered;
    if (!sort) return filtered;
    const sortedCopy = [...filtered];
    sortedCopy.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.key];
      const bv = (b as Record<string, unknown>)[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.direction === "asc" ? av - bv : bv - av;
      }
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sort.direction === "asc" ? -1 : 1;
      if (as > bs) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return sortedCopy;
  }, [filtered, sort, isServer]);

  // In server mode the API's ordering stands, so rows render as received.
  const paginated = isServer
    ? sorted
    : sorted.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  const rowCount = isServer ? (serverMode?.total ?? data.length) : sorted.length;
  const effectivePageSize = isServer ? (serverMode?.pageSize ?? pageSize) : pageSize;
  const totalPages = Math.max(1, Math.ceil(rowCount / effectivePageSize));
  const currentPage = isServer ? (serverMode?.page ?? 1) : pageIndex + 1;
  const safePageIndex = isServer ? currentPage - 1 : Math.min(pageIndex, totalPages - 1);

  const goToPage = (next: number) => {
    const clamped = Math.max(0, Math.min(next, totalPages - 1));
    if (isServer) {
      serverMode?.onPageChange(clamped + 1);
    } else {
      setPageIndex(clamped);
    }
  };

  const changePageSize = (next: number) => {
    if (isServer) {
      serverMode?.onPageSizeChange(next);
    } else {
      setPageSize(next);
      setPageIndex(0);
    }
  };

  const handleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable || !col.sortKey || isServer) return;
    const key = col.sortKey as string;
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const start = rowCount === 0 ? 0 : safePageIndex * effectivePageSize + 1;
  const end = Math.min(rowCount, (safePageIndex + 1) * effectivePageSize);

  // A full skeleton is fine for a first load, but in server mode it would
  // unmount the toolbar on every keystroke and steal focus from the search
  // box. There the table stays mounted and is marked busy instead.
  if (loading && !isServer) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(showSearch || toolbar || globalActions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            {showSearch && (
              <div className="relative max-w-xs flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={isServer ? (serverMode?.search ?? "") : search}
                  onChange={(e) => {
                    if (isServer) {
                      serverMode?.onSearchChange(e.target.value);
                    } else {
                      setSearch(e.target.value);
                      setPageIndex(0);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="pl-8 pr-8"
                />
                {(isServer ? serverMode?.search : search) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isServer) {
                        serverMode?.onSearchChange("");
                      } else {
                        setSearch("");
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            {toolbar}
          </div>
          {globalActions && (
            <div className="flex flex-wrap items-center gap-2">{globalActions}</div>
          )}
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg border bg-card">
        {isServer && loading && (
          <div
            className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur"
            role="status"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Updating…
          </div>
        )}
        <div
          className="overflow-x-auto"
          aria-busy={isServer && loading ? true : undefined}
        >
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      "h-10 px-3 text-left font-medium",
                      col.className,
                      col.hideOnMobile && "hidden md:table-cell"
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col)}
                        disabled={isServer}
                        title={
                          isServer
                            ? "Sorting is handled by the server"
                            : undefined
                        }
                        className="inline-flex items-center gap-1 hover:text-foreground disabled:cursor-default disabled:opacity-70"
                      >
                        {col.header}
                        {sort && sort.key === col.sortKey && (
                          <span className="text-foreground">
                            {sort.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-0">
                    {emptyState ?? (
                      <EmptyState
                        title="No results"
                        description="Try adjusting your search or filters to find what you're looking for."
                      />
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b transition-colors last:border-0",
                      onRowClick && "cursor-pointer hover:bg-muted/40"
                    )}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          "p-3 align-middle",
                          col.className,
                          col.hideOnMobile && "hidden md:table-cell"
                        )}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rowCount > 0 && (
          <div className="flex flex-col gap-3 border-t px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium text-foreground">{start}</span>–
              <span className="font-medium text-foreground">{end}</span> of{" "}
              <span className="font-medium text-foreground">{rowCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(effectivePageSize)}
                onValueChange={(v) => changePageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(0)}
                  disabled={safePageIndex === 0}
                  aria-label="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(safePageIndex - 1)}
                  disabled={safePageIndex === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(safePageIndex + 1)}
                  disabled={safePageIndex >= totalPages - 1}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages - 1)}
                  disabled={safePageIndex >= totalPages - 1}
                  aria-label="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}