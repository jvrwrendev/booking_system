import React from "react";
import { Pressable, View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Text } from "@/components/ui/text";

interface MenuRowProps {
  icon: LucideIcon;
  label: string;
  subtitle?: string;
  tone?: "default" | "danger";
  onPress: () => void;
}

export function MenuRow({
  icon: Icon,
  label,
  subtitle,
  tone = "default",
  onPress,
}: MenuRowProps) {
  const danger = tone === "danger";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-3 py-3 active:opacity-70"
    >
      <View
        className={`h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          danger ? "bg-danger/10" : "bg-primary/10"
        }`}
      >
        <Icon size={17} color={danger ? "#DC2626" : "#16A34A"} />
      </View>
      <View className="flex-1">
        <Text weight="semibold" tone={danger ? "danger" : "default"}>
          {label}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted" className="mt-0.5">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color="#94A3B8" />
    </Pressable>
  );
}
