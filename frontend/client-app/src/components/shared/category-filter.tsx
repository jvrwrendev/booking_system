import React, { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Check, Filter, X } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";

interface CategoryFilterButtonProps {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function CategoryFilterButton({
  categories,
  value,
  onChange,
  className,
}: CategoryFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const active = value !== "all";

  const options: { label: string; value: string }[] = [
    { label: "All categories", value: "all" },
    ...categories.map((c) => ({ label: c, value: c })),
  ];

  const select = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={
          active ? `Category filter: ${value}` : "Filter by category"
        }
        className={cn(
          "h-control w-[50px] items-center justify-center rounded-md border active:opacity-70",
          active
            ? "border-primary bg-primary/10"
            : "border-border bg-background",
          className,
        )}
      >
        <Filter size={18} color={active ? "#16A34A" : "#64748B"} />
        {active ? (
          <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        ) : null}
      </Pressable>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          className="flex-1 items-center justify-center bg-black/40 px-5"
        >
          <Pressable
            onPress={() => {}}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background"
            style={{
              shadowColor: "#0F172A",
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <Text variant="h3" weight="semibold">
                Filter by category
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close category filter"
                className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            <Divider />

            <View className="py-1">
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => select(opt.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className="flex-row items-center justify-between px-4 py-3 active:bg-secondary"
                  >
                    <Text
                      weight={selected ? "semibold" : "medium"}
                      tone={selected ? "primary" : "default"}
                      className="flex-1"
                      numberOfLines={1}
                    >
                      {opt.label}
                    </Text>
                    {selected ? (
                      <Check size={17} color="#16A34A" />
                    ) : (
                      <View className="h-[17px] w-[17px]" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
