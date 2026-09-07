import React from "react";
import { View } from "react-native";
import { Text } from "./text";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <View
      className={`flex-row items-center justify-between mb-3 ${className ?? ""}`}
    >
      <View className="flex-1 pr-2">
        <Text variant="h3" weight="semibold">
          {title}
        </Text>
        {subtitle && (
          <Text variant="small" tone="muted" className="mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
