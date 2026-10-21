import { cn } from "@/lib/utils";
import { LOCATION_STATUS_META } from "./LocationStatusBadge";
import type { LocationStatus } from "../types";

interface LocationStatsProps {
  counts: Record<LocationStatus, number>;
  total: number;
  /** Number of agents without a position fix, shown as its own tile. */
  className?: string;
}

const ORDER: LocationStatus[] = [
  "tracking",
  "offline",
  "location_unavailable",
];

/**
 * Compact status strip above the map.
 *
 * Deliberately flat: a hairline border and a status dot carry the meaning,
 * no elevation.
 */
export function LocationStats({ counts, total, className }: LocationStatsProps) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}
      role="group"
      aria-label="Agent location summary"
    >
      {ORDER.map((status) => {
        const meta = LOCATION_STATUS_META[status];
        return (
          <div
            key={status}
            className="rounded-lg border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn("h-1.5 w-1.5 rounded-full", meta.dot)}
                aria-hidden
              />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {meta.short}
              </span>
            </div>
            <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
              {counts[status] ?? 0}
            </div>
          </div>
        );
      })}

      <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground"
            aria-hidden
          />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Total
          </span>
        </div>
        <div className="mt-1 text-xl font-semibold tabular-nums text-foreground">
          {total}
        </div>
      </div>
    </div>
  );
}
