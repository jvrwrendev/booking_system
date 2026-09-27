/**
 * Agent location tracking domain types.
 *
 * NOTE: `LocationStatus` is intentionally independent of `Agent.status`
 * (`active | inactive | suspended`). An account can be active while the device
 * is offline, so the two concerns must never be conflated.
 */

export type LocationStatus = "tracking" | "offline" | "location_unavailable";

export interface AgentLocation {
  agentId: string;
  agentName: string;
  /** Null when the device has not reported a fix (`location_unavailable`). */
  latitude: number | null;
  /** Null when the device has not reported a fix (`location_unavailable`). */
  longitude: number | null;
  status: LocationStatus;
  /** ISO timestamp of the last known position report. */
  lastUpdated: string;
  /** Human-readable place the agent is believed to be at. */
  locationLabel: string;
}

export type LocationStatusFilter = LocationStatus | "all";

/**
 * The seam between the UI and whatever produces location data.
 *
 * The UI only ever talks to this interface, so replacing the mock with a real
 * GPS/websocket backend means providing a different implementation and passing
 * it to <AgentLocationsProvider service={...}> — no component changes.
 */
export interface LocationService {
  /** One-shot fetch of the current snapshot. */
  listLocations(): Promise<AgentLocation[]>;
  /**
   * Push updates. Returns an unsubscribe function.
   * A real implementation would open a websocket or SSE stream here and call
   * `onUpdate` on every inbound fix.
   */
  subscribe(onUpdate: (locations: AgentLocation[]) => void): () => void;
}
