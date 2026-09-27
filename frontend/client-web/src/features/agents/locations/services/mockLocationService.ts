import { mockAgentLocations } from "../data/mock-agent-locations";
import type { AgentLocation, LocationService } from "../types";

/**
 * Mock implementation of <LocationService>.
 *
 * Simulates GPS fixes entirely in memory: every tick, each `tracking` agent
 * drifts a few tens of metres and its `lastUpdated` is bumped. `offline` agents
 * keep their last known fix and `location_unavailable` agents never move.
 *
 * This is the only file that knows the data is fake. To go live, write another
 * <LocationService> against your real endpoint and hand it to the provider.
 */

/** Roughly 55 m of drift per tick — reads as vehicle movement, not teleporting. */
const JITTER_DEGREES = 0.0005;
const TICK_MS = 5000;

function jitter(value: number): number {
  return value + (Math.random() * 2 - 1) * JITTER_DEGREES;
}

function tick(locations: AgentLocation[]): AgentLocation[] {
  const now = new Date().toISOString();

  return locations.map((loc) => {
    if (loc.status !== "tracking") return loc;
    if (loc.latitude === null || loc.longitude === null) return loc;

    return {
      ...loc,
      latitude: jitter(loc.latitude),
      longitude: jitter(loc.longitude),
      lastUpdated: now,
    };
  });
}

export function createMockLocationService(
  seed: AgentLocation[] = mockAgentLocations,
  tickMs: number = TICK_MS
): LocationService {
  // Closed over so every subscriber shares one simulated world.
  let current: AgentLocation[] = seed;
  const listeners = new Set<(locations: AgentLocation[]) => void>();
  let timer: ReturnType<typeof setInterval> | null = null;

  const emit = () => {
    for (const listener of listeners) listener(current);
  };

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  return {
    async listLocations() {
      return current;
    },

    subscribe(onUpdate) {
      listeners.add(onUpdate);

      if (timer === null) {
        timer = setInterval(() => {
          current = tick(current);
          emit();
        }, tickMs);
      }

      onUpdate(current);

      return () => {
        listeners.delete(onUpdate);
        if (listeners.size === 0) stop();
      };
    },
  };
}

export const mockLocationService = createMockLocationService();
