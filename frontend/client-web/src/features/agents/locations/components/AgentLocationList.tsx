import { MapPinOff, MapPin } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, initials, relativeTime } from "@/lib/utils";
import { LocationStatusBadge } from "./LocationStatusBadge";
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
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-8 text-center",
          className
        )}
      >
        <p className="text-sm font-medium">No agents match</p>
        <p className="text-xs text-muted-foreground">
          Try a different search term or status filter.
        </p>
      </div>
    );
  }

  return (
    <ul className={cn("divide-y", className)}>
      {locations.map((location) => {
        const isSelected = location.agentId === selectedId;
        const hasFix = location.latitude !== null;

        return (
          <li key={location.agentId}>
            <button
              type="button"
              onClick={() => onSelect(location.agentId)}
              aria-current={isSelected}
              className={cn(
                "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                isSelected && "bg-muted"
              )}
            >
              <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                <AvatarFallback>
                  {initials(location.agentName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {location.agentName}
                  </span>
                  <LocationStatusBadge status={location.status} />
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  {hasFix ? (
                    <MapPin className="h-3 w-3 shrink-0" />
                  ) : (
                    <MapPinOff className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate">
                    {hasFix
                      ? location.locationLabel
                      : "No position reported"}
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
