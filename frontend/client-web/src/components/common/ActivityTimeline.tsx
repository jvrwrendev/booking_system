import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  by?: string;
  active?: boolean;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {events.map((event, idx) => (
        <li key={event.id} className="relative">
          <span
            className={cn(
              "absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center rounded-full border bg-background",
              event.active
                ? "border-primary text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            <Check className="h-3 w-3" />
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="text-sm font-medium">{event.title}</div>
            {event.description && (
              <div className="text-xs text-muted-foreground">
                {event.description}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground">
              {event.by && <span>{event.by}</span>}
              {event.by && event.timestamp && <span> · </span>}
              {event.timestamp && <span>{event.timestamp}</span>}
              {idx === events.length - 1 && (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Latest
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}