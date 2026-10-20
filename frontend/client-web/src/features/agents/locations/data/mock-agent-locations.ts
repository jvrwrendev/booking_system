import type { AgentLocation, LocationStatus } from "../types";

/**
 * Mock location seeds keyed to the existing agents in `mock-agents`.
 *
 * Coordinates are placed in each agent's registered city so the "All
 * Locations" map reads as a real Philippine territory spread rather than a
 * cluster. `lastUpdated` is derived from load time so relative timestamps
 * ("10 seconds ago") look realistic on first paint.
 */

const secondsAgo = (seconds: number) =>
  new Date(Date.now() - seconds * 1000).toISOString();

interface LocationSeed {
  agentId: string;
  agentName: string;
  latitude: number | null;
  longitude: number | null;
  status: LocationStatus;
  updatedSecondsAgo: number;
  locationLabel: string;
}

const SEEDS: LocationSeed[] = [
  {
    agentId: "AGT-001",
    agentName: "Roberto Garcia",
    latitude: 14.5995,
    longitude: 120.9842,
    status: "tracking",
    updatedSecondsAgo: 10,
    locationLabel: "San Agustin, Quezon City",
  },
  {
    agentId: "AGT-002",
    agentName: "Liza Tan",
    latitude: 10.3157,
    longitude: 123.8854,
    status: "tracking",
    updatedSecondsAgo: 24,
    locationLabel: "Mango Ave, City of Cebu",
  },
  {
    agentId: "AGT-003",
    agentName: "Mark Villanueva",
    latitude: 7.0686,
    longitude: 125.6076,
    status: "tracking",
    updatedSecondsAgo: 18,
    locationLabel: "Roxas Ave, Davao City",
  },
  {
    agentId: "AGT-004",
    agentName: "Anna Reyes",
    latitude: 10.72,
    longitude: 122.562,
    status: "tracking",
    updatedSecondsAgo: 47,
    locationLabel: "Diversion Rd, Iloilo City",
  },
  {
    agentId: "AGT-005",
    agentName: "Diego Santos",
    latitude: 16.402,
    longitude: 120.596,
    status: "tracking",
    updatedSecondsAgo: 5,
    locationLabel: "Session Rd, Baguio City",
  },
  {
    agentId: "AGT-006",
    agentName: "Patricia Cruz",
    latitude: 14.2133,
    longitude: 121.1654,
    status: "tracking",
    updatedSecondsAgo: 31,
    locationLabel: "National Highway, City of Calamba",
  },
  {
    agentId: "AGT-007",
    agentName: "Ramon Aquino",
    latitude: 15.0686,
    longitude: 120.6319,
    status: "offline",
    updatedSecondsAgo: 1800,
    locationLabel: "MacArthur Highway, San Fernando, Pampanga",
  },
  {
    agentId: "AGT-008",
    agentName: "Sofia Mendoza",
    latitude: 14.6511,
    longitude: 121.0494,
    status: "tracking",
    updatedSecondsAgo: 62,
    locationLabel: "U.P. Campus, Quezon City",
  },
  {
    agentId: "AGT-009",
    agentName: "Andres Bonifacio Jr.",
    latitude: null,
    longitude: null,
    status: "location_unavailable",
    updatedSecondsAgo: 7200,
    locationLabel: "Location unavailable",
  },
];

export const mockAgentLocations: AgentLocation[] = SEEDS.map((seed) => ({
  agentId: seed.agentId,
  agentName: seed.agentName,
  latitude: seed.latitude,
  longitude: seed.longitude,
  status: seed.status,
  lastUpdated: secondsAgo(seed.updatedSecondsAgo),
  locationLabel: seed.locationLabel,
}));

/** Default map viewport: centred on the Philippines. */
export const DEFAULT_MAP_CENTER = { latitude: 12.0, longitude: 122.0 };
export const DEFAULT_MAP_ZOOM = 5;
