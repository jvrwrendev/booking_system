import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

type Tone = "default" | "primary" | "success" | "warning" | "info" | "danger";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}

const chipToneClass: Record<Tone, string> = {
  default: "bg-secondary",
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  info: "bg-info/10",
  danger: "bg-danger/10",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={`flex-1 ${className ?? ""}`}>
      <View className="flex-row items-start justify-between gap-2">
        <Text
          variant="label"
          tone="muted"
          className="flex-1"
          numberOfLines={1}
        >
          {label}
        </Text>
        {icon ? (
          <View
            className={`h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chipToneClass[tone]}`}
          >
            {icon}
          </View>
        ) : null}
      </View>
      <Text variant="h1" weight="bold" className="mt-2.5">
        {value}
      </Text>
      {hint ? (
        <Text variant="small" tone="muted" className="mt-0.5">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}
