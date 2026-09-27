import { Suspense, lazy, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MapMarker } from "./MapCanvas";

export type { MapMarker } from "./MapCanvas";

/** Split point: everything Mapbox ships lands in its own chunk. */
const MapCanvas = lazy(() => import("./MapCanvas"));

export function hasMapboxToken(): boolean {
  return Boolean(import.meta.env.VITE_MAPBOX_TOKEN);
}

interface AgentLocationMapProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  initialCenter: { latitude: number; longitude: number };
  initialZoom: number;
  selectedZoom?: number;
  className?: string;
  showRecenter?: boolean;
  onRecenterClick?: () => void;
  recenterLabel?: string;
}

export function AgentLocationMap({
  markers,
  selectedId,
  onSelect,
  initialCenter,
  initialZoom,
  selectedZoom,
  className,
  showRecenter = true,
  onRecenterClick,
  recenterLabel = "Recenter Map",
}: AgentLocationMapProps) {
  const [tokenMissing] = useState(() => !hasMapboxToken());

  // Gate before the lazy import resolves so Mapbox is never fetched without a
  // configured token.
  if (tokenMissing) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 p-8 text-center",
          className
        )}
      >
        <Crosshair className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">Map not configured</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Set <code className="font-mono">VITE_MAPBOX_TOKEN</code> in{" "}
          <code className="font-mono">.env.local</code> and restart the dev
          server to display the map. Location data below is still live.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-muted/40">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <MapCanvas
          markers={markers}
          selectedId={selectedId}
          onSelect={onSelect}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          selectedZoom={selectedZoom}
          className="h-full w-full"
        />
      </Suspense>

      {showRecenter && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute left-3 top-3 z-10 shadow-sm"
          onClick={onRecenterClick}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {recenterLabel}
        </Button>
      )}
    </div>
  );
}
