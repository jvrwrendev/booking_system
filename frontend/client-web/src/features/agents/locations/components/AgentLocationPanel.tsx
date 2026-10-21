import { useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { cn, relativeTime } from "@/lib/utils";

import { AgentLocationList } from "./AgentLocationList";
import { LocationStatusBadge, LOCATION_STATUS_META } from "./LocationStatusBadge";
import type { AgentLocation, LocationStatusFilter } from "../types";

const FILTERS: { value: LocationStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tracking", label: "Tracking" },
  { value: "offline", label: "Offline" },
  { value: "location_unavailable", label: "No fix" },
];

interface AgentLocationPanelProps {
  locations: AgentLocation[];
  selectedId: string | null;
  onSelect: (agentId: string | null) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  className?: string;
}

/**
 * The right-hand rail of the tracking workspace: search, status filter and
 * the selectable agent list.
 */
export function AgentLocationPanel({
  locations,
  selectedId,
  onSelect,
  loading,
  error,
  onRetry,
  className,
}: AgentLocationPanelProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<LocationStatusFilter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return locations.filter((location) => {
      if (statusFilter !== "all" && location.status !== statusFilter)
        return false;
      if (!needle) return true;
      return (
        location.agentName.toLowerCase().includes(needle) ||
        location.locationLabel.toLowerCase().includes(needle) ||
        location.agentId.toLowerCase().includes(needle)
      );
    });
  }, [locations, query, statusFilter]);

  const counts = useMemo(() => {
    const base = { all: locations.length } as Record<string, number>;
    for (const location of locations) {
      base[location.status] = (base[location.status] ?? 0) + 1;
    }
    return base;
  }, [locations]);

  const selected = locations.find((l) => l.agentId === selectedId) ?? null;
  const hasQuery = query.length > 0 || statusFilter !== "all";

  return (
    <Card className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
      <div className="shrink-0 space-y-3 border-b p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            Agents
            <span className="ml-1.5 font-normal tabular-nums text-muted-foreground">
              ({filtered.length}/{locations.length})
            </span>
          </h2>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search agents or places…"
            aria-label="Search agents or places"
            className="h-9 pl-8 pr-8"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-0.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                aria-pressed={isActive}
                onClick={() => setStatusFilter(filter.value)}
                className="h-8 px-2.5 text-xs"
              >
                {filter.label}
                <span
                  className={cn(
                    "ml-1 tabular-nums",
                    isActive ? "opacity-80" : "text-muted-foreground"
                  )}
                >
                  {counts[filter.value] ?? 0}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="shrink-0 border-b bg-muted/40 px-4 py-2.5">
          {/* Announced once per selection. Kept off the timestamp below so the
              five-second feed tick never re-announces it. */}
          <span className="sr-only" aria-live="polite">
            Selected {selected.agentName},{" "}
            {LOCATION_STATUS_META[selected.status].label}
          </span>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium text-foreground">
                  {selected.agentName}
                </span>
                <LocationStatusBadge status={selected.status} />
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {selected.latitude !== null && selected.longitude !== null ? (
                  <>
                    <span className="tabular-nums">
                      {selected.latitude.toFixed(5)},{" "}
                      {selected.longitude.toFixed(5)}
                    </span>
                    {" · "}
                  </>
                ) : null}
                Updated {relativeTime(selected.lastUpdated)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={() => onSelect(null)}
              aria-label="Clear selected agent"
              className="shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        {error ? (
          <ErrorState
            title="Couldn't load locations"
            message={error}
            onRetry={onRetry}
            className="m-4"
          />
        ) : loading && locations.length === 0 ? (
          <div className="space-y-3 p-4" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" aria-hidden />}
            title={hasQuery ? "No agents match" : "No agents yet"}
            description={
              hasQuery
                ? "Try a different search term or status filter."
                : "Agents appear here once they report a location."
            }
            className="m-4"
            action={
              hasQuery ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <AgentLocationList
            locations={filtered}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        )}
      </ScrollArea>

      <div className="shrink-0 border-t px-4 py-2 text-xs text-muted-foreground">
        {selected ? (
          <span>
            Selected: {LOCATION_STATUS_META[selected.status].label}
          </span>
        ) : (
          <span>Select an agent to focus the map.</span>
        )}
      </div>
    </Card>
  );
}
