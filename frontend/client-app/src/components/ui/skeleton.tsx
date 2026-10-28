import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** Neutral placeholder used while a section is loading. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn("rounded-md bg-muted", className)}
    />
  );
}
