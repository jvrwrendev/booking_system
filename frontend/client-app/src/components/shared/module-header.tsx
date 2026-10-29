import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface ModuleHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Horizontal content padding to bleed through so the header aligns with the screen padding. */
  bleedX?: number;
  /** Top content padding to bleed through so the header keeps its original offset. */
  bleedTop?: number;
  /** Keep header text aligned with a centered max-width content column. */
  contentMaxWidth?: number;
  className?: string;
}

/**
 * Consistent top-level header for the Agent and Branch modules.
 *
 * Screens render this inside their existing padded list/scroll content; the
 * negative margins keep the header content aligned with the screen padding
 * while preserving the original plain (un-tinted) surface.
 */
export function ModuleHeader({
  eyebrow,
  title,
  subtitle,
  action,
  bleedX = 16,
  bleedTop = 16,
  contentMaxWidth,
  className,
}: ModuleHeaderProps) {
  return (
    <View
      className={cn(className)}
      style={{
        marginHorizontal: -bleedX,
        marginTop: -bleedTop,
        paddingHorizontal: bleedX,
        paddingTop: bleedTop,
      }}
    >
      <View
        className="flex-row items-center justify-between gap-3"
        style={
          contentMaxWidth
            ? {
                width: "100%",
                maxWidth: contentMaxWidth,
                alignSelf: "center",
              }
            : undefined
        }
      >
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
