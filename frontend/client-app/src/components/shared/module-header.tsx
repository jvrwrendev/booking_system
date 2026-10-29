import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Horizontal content padding to bleed through so the band reaches the edges. */
  bleedX?: number;
  /** Top content padding to bleed through so the band reaches the safe area. */
  bleedTop?: number;
  className?: string;
}

/**
 * Consistent top-level header surface for the Agent and Branch modules.
 *
 * Screens render this inside their existing padded list/scroll content; the
 * negative margins let the tinted band reach the screen edges without changing
 * the surrounding layout.
 */
export function ModuleHeader({
  eyebrow,
  title,
  subtitle,
  action,
  bleedX = 16,
  bleedTop = 16,
  className,
}: ModuleHeaderProps) {
  return (
    <View
      className={cn(
        "border-b border-primary/20 bg-primary/10 pb-4",
        className,
      )}
      style={{
        marginHorizontal: -bleedX,
        marginTop: -bleedTop,
        paddingHorizontal: bleedX,
        paddingTop: bleedTop,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          {eyebrow ? (
            <Text
              variant="small"
              weight="medium"
              className="text-foreground/70"
              numberOfLines={1}
            >
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="h1" weight="bold" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              variant="small"
              className="mt-1 text-foreground/70"
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action ? <View className="shrink-0">{action}</View> : null}
      </View>
    </View>
  );
}
