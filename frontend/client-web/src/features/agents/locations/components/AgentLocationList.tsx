import { MapPinOff, MapPin } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { cn, initials, relativeTime } from "@/lib/utils";
import {
  LocationStatusDot,
  LOCATION_STATUS_META,
} from "./LocationStatusBadge";
import type { AgentLocation } from "../types";

interface AgentLocationListProps {
  locations: AgentLocation[];
  selectedId: string | null;
  onSelect: (agentId: string) => void;
  className?: string;
}

export function AgentLocationList({
  locations,
  selectedId,
  onSelect,
  className,
}: AgentLocationListProps) {
  if (locations.length === 0) {
    return (
      <EmptyState
        icon={<MapPinOff className="h-5 w-5" aria-hidden />}
        title="No agents match"
        description="Try a different search term or status filter."
        className={cn("m-4 border-0 bg-transparent", className)}
      />
    );
  }

  return (
    <ul className={cn("divide-y", className)}>
      {locations.map((location) => {
        const isSelected = location.agentId === selectedId;
        const hasFix = location.latitude !== null;
        const meta = LOCATION_STATUS_META[location.status];

        return (
          <li key={location.agentId}>
            <button
              type="button"
              onClick={() => onSelect(location.agentId)}
              aria-pressed={isSelected}
              className={cn(
                "relative flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                isSelected && "bg-primary/5"
              )}
            >
              {isSelected && (
                <span
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  aria-hidden
                />
              )}

              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">
                  {initials(location.agentName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      isSelected
                        ? "font-semibold text-foreground"
                        : "font-medium text-foreground"
                    )}
                  >
                    {location.agentName}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <LocationStatusDot status={location.status} />
                    {meta.short}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {hasFix ? (
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  ) : (
                    <MapPinOff className="h-3 w-3 shrink-0" aria-hidden />
                  )}
                  <span className="truncate">
                    {hasFix ? location.locationLabel : "No position reported"}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Updated {relativeTime(location.lastUpdated)}
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
