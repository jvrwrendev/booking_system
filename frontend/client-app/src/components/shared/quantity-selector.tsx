import React from "react";
import { Pressable, View } from "react-native";
import { Plus, Minus } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 0,
  max,
  disabled,
  className,
}: QuantitySelectorProps) {
  const dec = () => {
    if (disabled) return;
    onChange(Math.max(min, value - 1));
  };
  const inc = () => {
    if (disabled) return;
    const next = value + 1;
    if (max !== undefined && next > max) return;
    onChange(next);
  };

  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <View
      className={cn(
        "flex-row items-center rounded-md border border-border bg-background overflow-hidden",
        disabled && "opacity-50",
        className,
      )}
    >
      <Pressable
        onPress={dec}
        disabled={disabled || atMin}
        className="h-10 w-10 items-center justify-center active:bg-secondary"
      >
        <Minus size={16} color={atMin ? "#CBD5E1" : "#0F172A"} />
      </Pressable>
      <View className="flex-1 items-center justify-center h-10 border-x border-border">
        <Text weight="semibold">{value}</Text>
      </View>
      <Pressable
        onPress={inc}
        disabled={disabled || atMax}
        className="h-10 w-10 items-center justify-center active:bg-secondary"
      >
        <Plus size={16} color={atMax || disabled ? "#CBD5E1" : "#0F172A"} />
      </Pressable>
    </View>
  );
}
