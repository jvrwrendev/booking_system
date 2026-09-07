import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { cn } from "@/lib/utils";

type Variant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "title"
  | "subtitle"
  | "body"
  | "small"
  | "muted"
  | "label";

type Tone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "muted";

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  weight?: "regular" | "medium" | "semibold" | "bold";
  className?: string;
}

const variantClass: Record<Variant, string> = {
  display: "text-3xl",
  h1: "text-2xl",
  h2: "text-xl",
  h3: "text-lg",
  title: "text-base",
  subtitle: "text-sm",
  body: "text-sm",
  small: "text-xs",
  muted: "text-xs",
  label: "text-[11px] uppercase tracking-wider",
};

const weightClass: Record<NonNullable<TextProps["weight"]>, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const toneClass: Record<Tone, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  muted: "text-muted-foreground",
};

export function Text({
  variant = "body",
  tone = "default",
  weight,
  className,
  ...props
}: TextProps) {
  const finalWeight =
    weight ??
    (variant === "display" ||
    variant === "h1" ||
    variant === "h2" ||
    variant === "h3" ||
    variant === "title"
      ? "semibold"
      : "regular");

  return (
    <RNText
      {...props}
      className={cn(
        variantClass[variant],
        weightClass[finalWeight],
        toneClass[tone],
        className,
      )}
    />
  );
}
