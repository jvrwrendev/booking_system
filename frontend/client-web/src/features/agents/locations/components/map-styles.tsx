import type { StyleSpecification } from "maplibre-gl";
import { Map } from "lucide-react";
import { Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Raster tile sources for the agent map.
 *
 * Both defaults are public endpoints that are fine for development and low
 * volume, and both are overridable so a licensed provider can be swapped in
 * without touching map code.
 *
 * - Satellite: Esri World Imagery, the most widely used keyless satellite
 *   source. Esri's basemap terms are stricter than OSM's, so production use
 *   should point VITE_SATELLITE_TILE_URL at imagery you are licensed for.
 * - Street: OpenStreetMap standard tiles, requires attribution.
 */
const DEFAULT_SATELLITE_TILES =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DEFAULT_STREET_TILES =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const ESRI_ATTRIBUTION =
  "Tiles © Esri — Esri, Maxar, Earthstar Geographics, and the GIS User Community";
const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

function rasterStyle(
  tiles: string,
  attribution: string,
  maxzoom: number
): StyleSpecification {
  return {
    version: 8,
    sources: {
      base: {
        type: "raster",
        tiles: [tiles],
        tileSize: 256,
        // Declared so MapLibre stops requesting tiles the source cannot serve
        // instead of painting them blank.
        maxzoom,
        attribution,
      },
    },
    layers: [{ id: "base", type: "raster", source: "base" }],
  };
}

export type MapStyleId = "satellite" | "street";

export const MAP_STYLE_OPTIONS: {
  id: MapStyleId;
  label: string;
  icon: typeof Map;
}[] = [
  { id: "satellite", label: "Satellite", icon: Layers },
  { id: "street", label: "Map", icon: Map },
];

export function mapStyle(id: MapStyleId): StyleSpecification {
  if (id === "street") {
    return rasterStyle(
      import.meta.env.VITE_STREET_TILE_URL ?? DEFAULT_STREET_TILES,
      OSM_ATTRIBUTION,
      19
    );
  }
  return rasterStyle(
    import.meta.env.VITE_SATELLITE_TILE_URL ?? DEFAULT_SATELLITE_TILES,
    ESRI_ATTRIBUTION,
    19
  );
}

/** Floating layer switcher. Positioned away from the map's own controls. */
export function MapStyleToggle({
  value,
  onChange,
  className,
}: {
  value: MapStyleId;
  onChange: (id: MapStyleId) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Map style"
      className={cn(
        "absolute bottom-3 left-3 z-10 flex overflow-hidden rounded-md border bg-background/95 shadow-sm",
        className
      )}
    >
      {MAP_STYLE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = option.id === value;
        return (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant="ghost"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              "h-7 gap-1.5 rounded-none px-2.5 text-[11px]",
              isActive
                ? "bg-primary/10 font-medium text-primary hover:bg-primary/15"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
