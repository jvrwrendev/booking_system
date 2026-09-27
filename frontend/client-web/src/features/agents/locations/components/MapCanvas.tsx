import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
} from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { cn, initials, relativeTime } from "@/lib/utils";
import {
  LOCATION_STATUS_LABEL,
  LOCATION_STATUS_MARKER_COLOR,
} from "./LocationStatusBadge";
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

export interface MapCanvasHandle {
  /** Fly to a single position, or to `null` to just re-fit the supplied bounds. */
  recenter: (target?: { latitude: number; longitude: number; zoom?: number }) => void;
  fitAll: (points: { latitude: number; longitude: number }[]) => void;
}

interface MapCanvasProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  initialCenter: { latitude: number; longitude: number };
  initialZoom: number;
  className?: string;
  onError?: (message: string) => void;
}

/**
 * The only module that imports Mapbox. It is loaded through a dynamic import
 * (see AgentLocationMap) so `mapbox-gl` never enters the main bundle.
 */
const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(
  function MapCanvas(
    {
      markers,
      selectedId,
      onSelect,
      initialCenter,
      initialZoom,
      className,
      onError,
    },
    ref
  ) {
    const mapRef = useRef<MapRef>(null);
    const [mapError, setMapError] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        recenter(target) {
          const map = mapRef.current;
          if (!map) return;

          if (!target) {
            const bounds = new LngLatBounds();
            for (const marker of markers) bounds.extend([marker.longitude, marker.latitude]);
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 64, duration: 800, maxZoom: 13 });
            }
            return;
          }

          map.flyTo({
            center: [target.longitude, target.latitude],
            zoom: target.zoom ?? 14,
            duration: 900,
          });
        },
        fitAll(points) {
          const map = mapRef.current;
          if (!map) return;

          const bounds = new LngLatBounds();
          for (const point of points) bounds.extend([point.longitude, point.latitude]);
          if (bounds.isEmpty()) return;

          map.fitBounds(bounds, { padding: 64, duration: 800, maxZoom: 13 });
        },
      }),
      [markers]
    );

    const selected = markers.find((m) => m.id === selectedId) ?? null;

    return (
      <div className={cn("relative", className)}>
        <Map
          ref={mapRef}
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN ?? ""}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          initialViewState={{
            longitude: initialCenter.longitude,
            latitude: initialCenter.latitude,
            zoom: initialZoom,
          }}
          reuseMaps
          style={{ width: "100%", height: "100%" }}
          onError={(event) => {
            const message = event?.error?.message ?? "Map failed to load.";
            setMapError(message);
            onError?.(message);
          }}
        >
          <NavigationControl position="top-right" />

          {markers.map((marker) => (
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
              <div className="relative flex h-9 w-9 cursor-pointer items-center justify-center">
                {marker.status === "tracking" && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />
                )}
                <span
                  className={cn(
                    "relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-xs font-semibold text-white shadow-md transition-transform hover:scale-110",
                    marker.status === "offline" && "opacity-60",
                    LOCATION_STATUS_MARKER_COLOR[marker.status]
                  )}
                >
                  {marker.initials}
                </span>
              </div>
            </Marker>
          ))}

          {selected && (
            <Popup
              longitude={selected.longitude}
              latitude={selected.latitude}
              anchor="bottom"
              offset={18}
              closeOnClick={false}
              onClose={() => onSelect(null)}
              maxWidth="260px"
            >
              <div className="space-y-1.5 p-1">
                <div className="text-sm font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">
                  {LOCATION_STATUS_LABEL[selected.status]}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selected.place}
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated {relativeTime(selected.lastUpdated)}
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 p-6 text-center">
            <div className="space-y-1">
              <p className="text-sm font-medium">Map unavailable</p>
              <p className="max-w-sm text-xs text-muted-foreground">{mapError}</p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default MapCanvas;
