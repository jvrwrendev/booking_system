import { useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, relativeTime } from "@/lib/utils";

import { useAgentLocations } from "../hooks/useAgentLocations";
import { AgentLocationMap } from "./AgentLocationMap";
import { AgentLocationList } from "./AgentLocationList";
import { LocationStatusBadge } from "./LocationStatusBadge";
import { toMapMarkers } from "./toMapMarkers";
import type { LocationStatusFilter } from "../types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../data/mock-agent-locations";

const FILTERS: { value: LocationStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tracking", label: "Tracking" },
  { value: "offline", label: "Offline" },
  { value: "location_unavailable", label: "Unavailable" },
];

export function AllLocationsTab() {
  const { locations, loading, isLive, lastSyncedAt } = useAgentLocations();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LocationStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitSignal, setFitSignal] = useState(0);

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

  const markers = useMemo(() => toMapMarkers(filtered), [filtered]);

  const counts = useMemo(() => {
    const base = { all: locations.length } as Record<string, number>;
    for (const location of locations) {
      base[location.status] = (base[location.status] ?? 0) + 1;
    }
    return base;
  }, [locations]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <AgentLocationMap
          markers={markers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          initialCenter={DEFAULT_MAP_CENTER}
          initialZoom={DEFAULT_MAP_ZOOM}
          selectedZoom={12}
          fitSignal={fitSignal}
          className="h-[560px] border"
          onRecenterClick={() => setFitSignal((n) => n + 1)}
          recenterLabel="Recenter Map"
        />
      </div>

      <Card className="flex flex-col">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">
              Agents
              <span className="ml-1.5 font-normal text-muted-foreground">
                ({filtered.length}/{locations.length})
              </span>
            </CardTitle>
            {loading && locations.length === 0 && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agents or locations..."
              className="h-9 pl-8 pr-8"
              aria-label="Search agents"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
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
                  className={cn("h-7 px-2.5 text-xs")}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                  <span className="ml-1 opacity-70">
                    {counts[filter.value] ?? 0}
                  </span>
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          <ScrollArea className="h-[380px]">
            <AgentLocationList
              locations={filtered}
              selectedId={selectedId}
              onSelect={(id) =>
                setSelectedId((current) => (current === id ? null : id))
              }
            />
          </ScrollArea>
        </CardContent>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            {(["tracking", "offline", "location_unavailable"] as const).map(
              (status) => (
                <span key={status} className="flex items-center gap-1">
                  <LocationStatusBadge status={status} />
                </span>
              )
            )}
          </span>
          {lastSyncedAt && (
            <span>
              {isLive ? "Live" : "Paused"} · {relativeTime(lastSyncedAt)}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
