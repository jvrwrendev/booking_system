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
type Size = "sm" | "md" | "lg";

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
  "flex-row items-center justify-center gap-2 rounded-md active:opacity-80 disabled:opacity-50";

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

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-5",
};

const textSizeClass: Record<Size, string> = {
  sm: "text-sm",
  md: "text-sm",
  lg: "text-base",
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
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      className={cn(
        baseClass,
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "destructive"
              ? "#fff"
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
                "font-semibold",
                textClassName,
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
