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
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
}

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  containerClassName,
  inputClassName,
  multiline,
  style,
  ...rest
}: InputProps) {
  return (
    <View className={cn("w-full", containerClassName)}>
      {label && (
        <Text variant="label" tone="muted" className="mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={cn(
          "flex-row items-center rounded-md border bg-background px-3",
          error ? "border-danger" : "border-border",
          multiline ? "py-2" : "h-11",
          rest.editable === false && "opacity-60",
        )}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          {...rest}
          multiline={multiline}
          placeholderTextColor="#94A3B8"
          style={[
            {
              flex: 1,
              fontSize: 14,
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
