import React from "react";
import { View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

type Tone = "default" | "primary" | "success" | "warning" | "info" | "danger";

interface StatCardProps {
  label: string;
  value: number | string;
  tone?: Tone;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  tone = "default",
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={`flex-1 ${className ?? ""}`}>
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text variant="small" tone="muted" className="flex-1">
          {label}
        </Text>
      </View>
      <Text variant="h2" weight="bold" tone={tone} className="mt-1">
        {value}
      </Text>
    </Card>
  );
}