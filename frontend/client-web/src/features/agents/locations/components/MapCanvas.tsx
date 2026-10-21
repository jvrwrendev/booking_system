import { useEffect, useRef, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from "react-map-gl/maplibre";
import { LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { cn, relativeTime } from "@/lib/utils";
import {
  LOCATION_STATUS_LABEL,
  LOCATION_STATUS_MARKER_COLOR,
  LocationStatusDot,
} from "./LocationStatusBadge";
import { mapStyle, type MapStyleId } from "./map-styles";
import type { LocationStatus } from "../types";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  initials: string;
  status: LocationStatus;
  lastUpdated: string;
  place: string;
}

interface MapCanvasProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  initialCenter: { latitude: number; longitude: number };
  initialZoom: number;
  /** Zoom applied when flying to a selected marker. */
  selectedZoom?: number;
  /** Bump to force a refit — powers the Recenter control. */
  fitSignal?: number;
  /** Raster base layer to draw. */
  styleId?: MapStyleId;
  className?: string;
  onError?: (message: string) => void;
}

/**
 * The only module that imports the map engine. It is loaded through a dynamic
 * import (see AgentLocationMap) so `maplibre-gl` never enters the main bundle.
 */
export default function MapCanvas({
  markers,
  selectedId,
  onSelect,
  initialCenter,
  initialZoom,
  selectedZoom = 14,
  fitSignal = 0,
  styleId = "satellite",
  className,
  onError,
}: MapCanvasProps) {
  const mapRef = useRef<MapRef>(null);
  // The raster style is built locally, so it cannot fail to load. Once it is
  // up, any error is an individual tile miss, which must not blank the map.
  const styleReadyRef = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // A style switch replaces the source, so wait for it to come up before
  // treating later errors as non-fatal.
  useEffect(() => {
    styleReadyRef.current = false;
  }, [styleId]);

  const selected = markers.find((m) => m.id === selectedId) ?? null;

  // Refit when the visible set or the selection changes, and on demand via
  // fitSignal. Keyed on marker *ids* so 5s position jitter never causes a refit.
  const markerKey = markers.map((m) => m.id).join(",");

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selected) {
      map.flyTo({
        center: [selected.longitude, selected.latitude],
        zoom: selectedZoom,
        duration: 900,
      });
      return;
    }

    const bounds = new LngLatBounds();
    for (const marker of markers)
      bounds.extend([marker.longitude, marker.latitude]);
    if (bounds.isEmpty()) return;

    map.fitBounds(bounds, { padding: 64, duration: 800, maxZoom: 13 });
    // `markers` is intentionally excluded: only identity changes should refit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerKey, selectedId, fitSignal, selectedZoom]);

  return (
    <div
      className={cn("relative h-full w-full", className)}
      role="application"
      aria-label={`Agent location map with ${markers.length} agent${
        markers.length === 1 ? "" : "s"
      }`}
    >
      <Map
        ref={mapRef}
        mapStyle={mapStyle(styleId)}
        initialViewState={{
          longitude: initialCenter.longitude,
          latitude: initialCenter.latitude,
          zoom: initialZoom,
        }}
        reuseMaps
        style={{ width: "100%", height: "100%" }}
        onStyleData={() => {
          styleReadyRef.current = true;
          setMapError(null);
        }}
        onError={(event) => {
          if (styleReadyRef.current) return;
          const message = event?.error?.message ?? "Map failed to load.";
          setMapError(message);
          onError?.(message);
        }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {markers.map((marker) => {
          const isSelected = marker.id === selectedId;
          return (
            <Marker
              key={marker.id}
              longitude={marker.longitude}
              latitude={marker.latitude}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                onSelect(marker.id);
              }}
            >
              <div
                className="relative flex h-9 w-9 cursor-pointer items-center justify-center"
                role="button"
                tabIndex={0}
                aria-label={`${marker.name}, ${LOCATION_STATUS_LABEL[marker.status]}`}
                aria-pressed={isSelected}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(marker.id);
                  }
                }}
              >
                {marker.status === "tracking" && (
                  <span
                    className="absolute inset-0 rounded-full bg-primary/20"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-primary-foreground transition-transform",
                    marker.status === "offline" && "opacity-70",
                    isSelected && "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background",
                    LOCATION_STATUS_MARKER_COLOR[marker.status]
                  )}
                  aria-hidden
                >
                  {marker.initials}
                </span>
              </div>
            </Marker>
          );
        })}

        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            anchor="bottom"
            offset={22}
            closeOnClick={false}
            onClose={() => onSelect(null)}
            maxWidth="260px"
            className="agrivet-map-popup"
          >
            <div className="space-y-1 p-0.5">
              <div className="text-sm font-semibold text-foreground">
                {selected.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <LocationStatusDot status={selected.status} />
                {LOCATION_STATUS_LABEL[selected.status]}
              </div>
              <div className="text-xs text-muted-foreground">
                {selected.place}
              </div>
              <div className="pt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                {selected.latitude.toFixed(5)},{" "}
                {selected.longitude.toFixed(5)}
              </div>
              <div className="text-xs text-muted-foreground">
                Updated {relativeTime(selected.lastUpdated)}
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {mapError && (
        <div
          role="alert"
          className="absolute inset-0 z-10 flex items-center justify-center bg-background/95 p-6 text-center"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Map unavailable
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
