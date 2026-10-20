import React from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg" | "control";

const MUTED_FOREGROUND = "#64748B";

interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const baseClass =
  "flex-row items-center justify-center gap-2 rounded-md active:opacity-80 hover:opacity-90";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  outline: "border border-input bg-background",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
};

const variantTextClass: Record<Variant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  outline: "text-foreground",
  ghost: "text-foreground",
  destructive: "text-destructive-foreground",
};

const variantDisabledClass: Record<Variant, string> = {
  primary: "disabled:bg-secondary",
  secondary: "disabled:bg-muted",
  outline: "disabled:bg-secondary",
  ghost: "disabled:bg-secondary",
  destructive: "disabled:bg-secondary",
};

const variantDisabledTextClass: Record<Variant, string> = {
  primary: "disabled:text-muted-foreground",
  secondary: "disabled:text-muted-foreground",
  outline: "disabled:text-muted-foreground",
  ghost: "disabled:text-muted-foreground",
  destructive: "disabled:text-muted-foreground",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-5",
  control: "h-control px-5",
};

const textSizeClass: Record<Size, string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
  control: "text-[15px]",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  textClassName,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = Boolean(disabled);
  const isBusy = Boolean(loading);
  const blocked = isDisabled || isBusy;
  const dimmed = isDisabled && !isBusy;

  return (
    <Pressable
      {...rest}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: isBusy }}
      className={cn(
        baseClass,
        variantClass[variant],
        dimmed && variantDisabledClass[variant],
        isBusy && "opacity-90",
        sizeClass[size],
        fullWidth && "w-full",
        className
      )}
    >
      {isBusy ? (
        <ActivityIndicator
          color={
            dimmed
              ? MUTED_FOREGROUND
              : variant === "primary" || variant === "destructive"
                ? "#FFFFFF"
                : "#0F172A"
          }
        />
      ) : (
        <>
          {leftIcon}
          {children ?? (
            <Text
              className={cn(
                textSizeClass[size],
                variantTextClass[variant],
                dimmed && variantDisabledTextClass[variant],
                "font-semibold",
                textClassName
              )}
            >
              {label}
            </Text>
          )}
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
