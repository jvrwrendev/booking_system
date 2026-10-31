import React from "react";
import { View } from "react-native";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import type { StatusHistoryEntry } from "@/types/order-history";
import { humanizeStatus } from "@/types/status";
import { formatDateTime } from "@/lib/utils";

interface StatusTimelineProps {
  events: StatusHistoryEntry[];
  className?: string;
}

export function StatusTimeline({ events, className }: StatusTimelineProps) {
  if (!events.length) {
    return (
      <Text variant="small" tone="muted" className={className}>
        No timeline events yet.
      </Text>
    );
  }

  return (
    <View className={cn("pl-2", className)}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        return (
          <View key={event.id} className="flex-row">
            <View className="items-center mr-3">
              <View
                className={cn(
                  "h-6 w-6 rounded-full border-2 items-center justify-center bg-background",
                  isLast ? "border-primary" : "border-border",
                )}
              >
                <Check size={12} color={isLast ? "#16A34A" : "#64748B"} />
              </View>
              {!isLast && (
                <View className="w-px flex-1 bg-border my-1" />
              )}
            </View>
            <View className="flex-1 pb-4">
              <Text variant="subtitle" weight="semibold">
                {event.label}
              </Text>
              {event.from && event.from !== event.to ? (
                <Text variant="small" tone="muted" className="mt-0.5">
                  {humanizeStatus(event.from)} → {humanizeStatus(event.to)}
                </Text>
              ) : null}
              <Text variant="small" tone="muted" className="mt-0.5">
                {event.by}
                {event.by ? " · " : ""}
                {formatDateTime(event.timestamp)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
