import { initials } from "@/lib/utils";
import type { MapMarker } from "./MapCanvas";
import type { AgentLocation } from "../types";

/**
 * Project location records onto map markers.
 *
 * Agents reporting `location_unavailable` have null coordinates and are
 * deliberately skipped here — they still appear in the agent list, just not on
 * the map.
 */
export function toMapMarkers(locations: AgentLocation[]): MapMarker[] {
  const markers: MapMarker[] = [];

  for (const location of locations) {
    if (location.latitude === null || location.longitude === null) continue;

    markers.push({
      id: location.agentId,
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.agentName,
      initials: initials(location.agentName),
      status: location.status,
      lastUpdated: location.lastUpdated,
      place: location.locationLabel,
    });
  }

  return markers;
}

export function toMapMarker(location: AgentLocation): MapMarker | null {
  if (location.latitude === null || location.longitude === null) return null;

  return {
    id: location.agentId,
    latitude: location.latitude,
    longitude: location.longitude,
    name: location.agentName,
    initials: initials(location.agentName),
    status: location.status,
    lastUpdated: location.lastUpdated,
    place: location.locationLabel,
  };
}
