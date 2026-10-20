import React from "react";
import {
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { cn } from "@/lib/utils";
import { Text } from "./text";

interface InputProps extends TextInputProps {
  label?: string;
  labelAction?: React.ReactNode;
  hint?: string;
  error?: string;
  size?: "sm" | "md" | "control";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  inputRef?: React.Ref<TextInput>;
}

const sizeClass: Record<NonNullable<InputProps["size"]>, string> = {
  sm: "h-9",
  md: "h-11",
  control: "h-control",
};

const sizeFontSize: Record<NonNullable<InputProps["size"]>, number> = {
  sm: 13,
  md: 14,
  control: 15,
};

export function Input({
  label,
  labelAction,
  hint,
  error,
  size = "md",
  leftIcon,
  rightIcon,
  containerClassName,
  inputClassName,
  inputRef,
  multiline,
  style,
  ...rest
}: InputProps) {
  return (
    <View className={cn("w-full", containerClassName)}>
      {label && (
        <View className="flex-row items-center justify-between mb-1.5">
          <Text variant="label" tone="muted">
            {label}
          </Text>
          {labelAction}
        </View>
      )}
      <View
        className={cn(
          "flex-row items-center rounded-md border bg-background px-3",
          error
            ? "border-danger focus-within:border-danger"
            : "border-border hover:border-primary focus-within:border-primary",
          multiline ? "py-2" : sizeClass[size],
          rest.editable === false && "opacity-60"
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          {...rest}
          ref={inputRef}
          multiline={multiline}
          accessibilityState={{ disabled: rest.editable === false }}
          placeholderTextColor="#94A3B8"
          style={[
            {
              flex: 1,
              fontSize: sizeFontSize[size],
              color: "#0F172A",
              paddingVertical: multiline ? 4 : 0,
            },
            style as TextStyle,
          ]}
          className={cn(inputClassName)}
        />
        {rightIcon && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error ? (
        <Text variant="small" tone="danger" className="mt-1">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="muted" className="mt-1">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
