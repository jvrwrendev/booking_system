import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

interface ChipOption<T extends string = string> {
  label: string;
  value: T;
}

interface ChipGroupProps<T extends string = string> {
  options: ChipOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  className?: string;
}

export function ChipGroup<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: ChipGroupProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      className={className}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange?.(opt.value)}
            className={cn(
              "rounded-full border px-3 h-8 flex-row items-center justify-center",
              active
                ? "bg-primary border-primary"
                : "bg-background border-border",
            )}
          >
            <Text
              variant="small"
              weight="medium"
              className={cn(active ? "text-white" : "text-foreground")}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface SelectProps<T extends string = string> {
  label?: string;
  options: ChipOption<T>[];
  value?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function Select<T extends string = string>({
  label,
  options,
  value,
  onChange,
  placeholder = "Select option",
  className,
  error,
}: SelectProps<T>) {
  return (
    <View className={className}>
      {label && (
        <Text variant="label" tone="muted" className="mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "rounded-md border bg-background px-3 min-h-[44px] justify-center",
          error ? "border-danger" : "border-border",
        )}
      >
        <ChipGroup options={options} value={value} onChange={onChange} />
        {!value && (
          <Text variant="small" tone="muted" className="mt-1">
            {placeholder}
          </Text>
        )}
      </View>
      {error && (
        <Text variant="small" tone="danger" className="mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
