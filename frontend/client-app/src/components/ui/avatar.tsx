import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const textSize: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      className={cn(
        "rounded-full bg-primary/10 items-center justify-center",
        sizeClass[size],
        className,
      )}
    >
      <Text weight="semibold" tone="primary" className={textSize[size]}>
        {initials || "?"}
      </Text>
    </View>
  );
}
