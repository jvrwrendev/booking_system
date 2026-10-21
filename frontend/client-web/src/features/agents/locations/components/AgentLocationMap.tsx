import { Suspense, lazy, useEffect, useState } from "react";
import { Crosshair } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { MapStyleToggle, type MapStyleId } from "./map-styles";
import { MapLegend } from "./MapLegend";
import type { MapMarker } from "./MapCanvas";

export type { MapMarker } from "./MapCanvas";

/** Split point: everything the map engine ships lands in its own chunk. */
const MapCanvas = lazy(() => import("./MapCanvas"));

const STYLE_KEY = "agrivet-map-style";

function readStoredStyle(): MapStyleId {
  try {
    return localStorage.getItem(STYLE_KEY) === "street" ? "street" : "satellite";
  } catch {
    return "satellite";
  }
}

interface AgentLocationMapProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  initialCenter: { latitude: number; longitude: number };
  initialZoom: number;
  selectedZoom?: number;
  /** Bump to force a refit — powers the Recenter control. */
  fitSignal?: number;
  className?: string;
  showRecenter?: boolean;
  onRecenterClick?: () => void;
  recenterLabel?: string;
  /** Hides the status legend, e.g. when only one agent is on the map. */
  showLegend?: boolean;
}

export function AgentLocationMap({
  markers,
  selectedId,
  onSelect,
  initialCenter,
  initialZoom,
  selectedZoom,
  fitSignal = 0,
  className,
  showRecenter = true,
  onRecenterClick,
  recenterLabel = "Recenter",
  showLegend = true,
}: AgentLocationMapProps) {
  const [styleId, setStyleId] = useState<MapStyleId>(readStoredStyle);

  // Remember the base layer choice across visits.
  useEffect(() => {
    try {
      localStorage.setItem(STYLE_KEY, styleId);
    } catch {
      // Non-critical: a blocked storage just means the choice won't persist.
    }
  }, [styleId]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-muted/40",
        className
      )}
    >
      <Suspense
        fallback={
          <div
            className="flex h-full w-full items-center justify-center bg-muted/40"
            aria-busy="true"
          >
            <Spinner className="h-5 w-5" label="Loading map" />
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
          fitSignal={fitSignal}
          styleId={styleId}
          className="h-full w-full"
        />
      </Suspense>

      {showLegend && <MapLegend />}

      <div className="absolute right-3 top-3 z-10 flex items-center overflow-hidden rounded-md border bg-background">
        <MapStyleToggle value={styleId} onChange={setStyleId} />
        {showRecenter && (
          <>
            <Separator orientation="vertical" className="h-8" />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onRecenterClick}
              className="h-8 gap-1.5 rounded-none px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <Crosshair className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">{recenterLabel}</span>
              <span className="sr-only sm:hidden">{recenterLabel}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
