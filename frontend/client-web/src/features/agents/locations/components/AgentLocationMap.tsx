import { Suspense, lazy, useRef, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MapCanvasHandle, MapMarker } from "./MapCanvas";

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
  className?: string;
  /** Hide the floating Recenter control (e.g. when the map is already fit-to-all). */
  showRecenter?: boolean;
  onRecenter?: (map: MapCanvasHandle) => void;
}

export function AgentLocationMap({
  markers,
  selectedId,
  onSelect,
  initialCenter,
  initialZoom,
  className,
  showRecenter = true,
  onRecenter,
}: AgentLocationMapProps) {
  const mapRef = useRef<MapCanvasHandle>(null);
  const [tokenMissing] = useState(() => !hasMapboxToken());

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
          ref={mapRef}
          markers={markers}
          selectedId={selectedId}
          onSelect={onSelect}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          className="h-full w-full"
        />
      </Suspense>

      {showRecenter && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute left-3 top-3 z-10 shadow-sm"
          onClick={() => onRecenter?.(mapRef.current as MapCanvasHandle)}
        >
          <Crosshair className="h-3.5 w-3.5" />
          Recenter Map
        </Button>
      )}
    </div>
  );
}
