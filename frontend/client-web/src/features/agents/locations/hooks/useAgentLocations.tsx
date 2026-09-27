import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { mockLocationService } from "../services/mockLocationService";
import type { AgentLocation, LocationService } from "../types";

interface AgentLocationsContextValue {
  locations: AgentLocation[];
  loading: boolean;
  error: string | null;
  /** False when the simulated feed is paused by the user. */
  isLive: boolean;
  setIsLive: (live: boolean) => void;
  getLocation: (agentId: string) => AgentLocation | undefined;
  /** ISO timestamp of the most recent feed emission. */
  lastSyncedAt: string | null;
}

const AgentLocationsContext =
  createContext<AgentLocationsContextValue | null>(null);

/**
 * Owns the location feed lifecycle. It knows nothing about how locations are
 * produced — swap the `service` prop for a real GPS/websocket implementation
 * and every consumer keeps working unchanged.
 */
export function AgentLocationsProvider({
  children,
  service = mockLocationService,
}: {
  children: ReactNode;
  service?: LocationService;
}) {
  const [locations, setLocations] = useState<AgentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isTabVisible, setIsTabVisible] = useState(
    () => typeof document === "undefined" || !document.hidden
  );

  // Don't burn cycles simulating movement for a tab nobody is looking at.
  useEffect(() => {
    const onVisibilityChange = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!isLive || !isTabVisible) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    service
      .listLocations()
      .then((snapshot) => {
        if (!cancelled) {
          setLocations(snapshot);
          setLastSyncedAt(new Date().toISOString());
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load agent locations.");
      });

    const unsubscribe = service.subscribe((next) => {
      if (cancelled) return;
      setLocations(next);
      setLastSyncedAt(new Date().toISOString());
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [service, isLive, isTabVisible]);

  const getLocation = useCallback(
    (agentId: string) => locations.find((l) => l.agentId === agentId),
    [locations]
  );

  const value = useMemo<AgentLocationsContextValue>(
    () => ({
      locations,
      loading,
      error,
      isLive,
      setIsLive,
      getLocation,
      lastSyncedAt,
    }),
    [locations, loading, error, isLive, getLocation, lastSyncedAt]
  );

  return (
    <AgentLocationsContext.Provider value={value}>
      {children}
    </AgentLocationsContext.Provider>
  );
}

export function useAgentLocations(): AgentLocationsContextValue {
  const ctx = useContext(AgentLocationsContext);
  if (!ctx) {
    throw new Error(
      "useAgentLocations must be used within AgentLocationsProvider"
    );
  }
  return ctx;
}
