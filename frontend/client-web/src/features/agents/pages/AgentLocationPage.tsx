import { useEffect, useMemo, useState } from "react";
import { MapPinOff, Pause, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { cn, relativeTime } from "@/lib/utils";

import { AgentLocationsProvider, useAgentLocations } from "../locations/hooks/useAgentLocations";
import { AgentLocationMap } from "../locations/components/AgentLocationMap";
import { AgentLocationPanel } from "../locations/components/AgentLocationPanel";
import { LocationStats } from "../locations/components/LocationStats";
import { toMapMarkers } from "../locations/components/toMapMarkers";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../locations/data/mock-agent-locations";
import type { LocationStatus } from "../locations/types";

export function AgentLocationPage() {
  return (
    <AgentLocationsProvider>
      <LocationTrackingWorkspace />
    </AgentLocationsProvider>
  );
}

/**
 * The field-tracking workspace: one map, one agent list.
 *
 * Selecting an agent in the list flies the map to them and opens their
 * callout; selecting a marker highlights the matching row. Escape clears the
 * selection so keyboard users are never trapped in a focus state.
 */
function LocationTrackingWorkspace() {
  const { locations, loading, error, isLive, setIsLive, lastSyncedAt, reload } =
    useAgentLocations();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitSignal, setFitSignal] = useState(0);

  const markers = useMemo(() => toMapMarkers(locations), [locations]);

  const counts = useMemo(() => {
    const base: Record<LocationStatus, number> = {
      tracking: 0,
      offline: 0,
      location_unavailable: 0,
    };
    for (const location of locations) base[location.status] += 1;
    return base;
  }, [locations]);

  // A selected agent can drop out of the feed; don't keep a stale highlight.
  useEffect(() => {
    if (selectedId && !locations.some((l) => l.agentId === selectedId)) {
      setSelectedId(null);
    }
  }, [locations, selectedId]);

  // Escape clears the selection, mirroring the popup's close button.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selected = locations.find((l) => l.agentId === selectedId) ?? null;

  // Only centre on the selection when it actually has a fix; agents without
  // one are selected from the list but cannot be plotted.
  const hasFix =
    selected !== null &&
    selected.latitude !== null &&
    selected.longitude !== null;

  const initialCenter = hasFix
    ? { latitude: selected!.latitude!, longitude: selected!.longitude! }
    : DEFAULT_MAP_CENTER;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Location Tracking"
        description="Monitor sales agents in the field and see where each last reported."
        breadcrumbs={[
          { label: "People" },
          { label: "Agents" },
          { label: "Location Tracking" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted" className="text-xs">
              Sample data
            </Badge>

            <div className="flex items-center gap-2 rounded-md border bg-background px-2.5 py-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isLive ? "bg-success" : "bg-muted-foreground"
                )}
                aria-hidden
              />
              <span className="text-xs font-medium text-foreground">
                {isLive ? "Live" : "Paused"}
              </span>
              {lastSyncedAt && (
                <span className="text-xs text-muted-foreground">
                  · {relativeTime(lastSyncedAt)}
                </span>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              aria-pressed={isLive}
            >
              {isLive ? (
                <Pause className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Play className="h-3.5 w-3.5" aria-hidden />
              )}
              {isLive ? "Pause" : "Resume"}
            </Button>
          </div>
        }
      />

      <LocationStats counts={counts} total={locations.length} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="relative">
          <AgentLocationMap
            markers={markers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            initialCenter={initialCenter}
            initialZoom={hasFix ? 13 : DEFAULT_MAP_ZOOM}
            selectedZoom={14}
            fitSignal={fitSignal}
            className="h-[360px] md:h-[460px] lg:h-[640px]"
            onRecenterClick={() => {
              setSelectedId(null);
              setFitSignal((n) => n + 1);
            }}
            recenterLabel="Fit all"
          />

          {!loading && markers.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6">
              <div className="pointer-events-auto flex max-w-xs flex-col items-center gap-1 rounded-lg border bg-background px-4 py-3 text-center">
                <MapPinOff
                  className="mb-0.5 h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
                <p className="text-sm font-medium text-foreground">
                  No positions to plot
                </p>
                <p className="text-xs text-muted-foreground">
                  Agents without a location fix are listed in the panel only.
                </p>
              </div>
            </div>
          )}
        </div>

        <AgentLocationPanel
          className="h-[420px] lg:h-[640px]"
          locations={locations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
          error={error}
          onRetry={reload}
        />
      </div>
    </div>
  );
}
