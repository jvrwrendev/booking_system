import { cn } from "@/lib/utils";
import { LOCATION_STATUS_META } from "./LocationStatusBadge";
import type { LocationStatus } from "../types";

const ORDER: LocationStatus[] = ["tracking", "offline", "location_unavailable"];

/**
 * Map overlay legend.
 *
 * The list panel also communicates status, but the map is often looked at on
 * its own — the legend keeps the colours self-explanatory there.
 */
export function MapLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3 top-3 z-10 hidden items-center gap-3 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:flex",
        className
      )}
      aria-hidden
    >
      {ORDER.map((status) => {
        const meta = LOCATION_STATUS_META[status];
        return (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.short}
          </span>
        );
      })}
    </div>
  );
}
