import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

type Tone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "muted"
  | "info";

interface BadgeProps {
  label: string;
  tone?: Tone;
  variant?: "solid" | "subtle" | "outline";
  className?: string;
}

const toneClass: Record<
  Tone,
  { solid: string; subtle: string; outline: string; text: string }
> = {
  default: {
    solid: "bg-foreground",
    subtle: "bg-secondary",
    outline: "border border-border bg-transparent",
    text: "text-foreground",
  },
  primary: {
    solid: "bg-primary",
    subtle: "bg-primary/10",
    outline: "border border-primary/30 bg-transparent",
    text: "text-primary",
  },
  success: {
    solid: "bg-success",
    subtle: "bg-success/10",
    outline: "border border-success/30 bg-transparent",
    text: "text-success",
  },
  warning: {
    solid: "bg-warning",
    subtle: "bg-warning/10",
    outline: "border border-warning/30 bg-transparent",
    text: "text-warning",
  },
  danger: {
    solid: "bg-danger",
    subtle: "bg-danger/10",
    outline: "border border-danger/30 bg-transparent",
    text: "text-danger",
  },
  info: {
    solid: "bg-info",
    subtle: "bg-info/10",
    outline: "border border-info/30 bg-transparent",
    text: "text-info",
  },
  muted: {
    solid: "bg-muted",
    subtle: "bg-muted",
    outline: "border border-border bg-transparent",
    text: "text-muted-foreground",
  },
};

export function Badge({
  label,
  tone = "default",
  variant = "subtle",
  className,
}: BadgeProps) {
  const t = toneClass[tone];
  const variantStyle =
    variant === "solid"
      ? t.solid
      : variant === "outline"
        ? t.outline
        : t.subtle;
  const textTone =
    variant === "solid" && (tone === "primary" || tone === "danger")
      ? "text-white"
      : t.text;
  return (
    <View
      className={cn(
        "self-start rounded-full px-2.5 py-1",
        variantStyle,
        className,
      )}
    >
      <Text variant="label" weight="semibold" className={cn(textTone)}>
        {label}
      </Text>
    </View>
  );
}
