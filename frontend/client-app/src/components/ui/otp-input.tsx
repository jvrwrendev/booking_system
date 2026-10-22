import React, { useEffect, useRef } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from "react-native";
import { cn } from "@/lib/utils";

const DEFAULT_LENGTH = 6;

interface OtpInputProps {
  /** Digits entered so far, e.g. "123" or "123456". */
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  editable?: boolean;
  hasError?: boolean;
  /** Called once all boxes are filled. */
  onComplete?: (value: string) => void;
  /** Increment to move focus back to the first box. */
  focusKey?: number;
}

function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function OtpInput({
  value,
  onChange,
  length = DEFAULT_LENGTH,
  autoFocus = true,
  editable = true,
  hasError = false,
  onComplete,
  focusKey = 0,
}: OtpInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => refs.current[0]?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (focusKey > 0) refs.current[0]?.focus();
  }, [focusKey]);

  useEffect(() => {
    if (value.length < length) completedRef.current = false;
  }, [value, length]);

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(next);
    }
  };

  const focusBox = (index: number) => {
    const target = Math.min(Math.max(index, 0), length - 1);
    refs.current[target]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digits = digitsOnly(raw);

    if (digits.length === 0) {
      const next = value.slice(0, index) + value.slice(index + 1);
      commit(next);
      return;
    }

    // Paste/autofill can deliver the whole code at once.
    if (digits.length > 1) {
      const next = (value.slice(0, index) + digits).slice(0, length);
      commit(next);
      focusBox(next.length);
      return;
    }

    const next = (value.slice(0, index) + digits + value.slice(index + 1)).slice(
      0,
      length,
    );
    commit(next);
    focusBox(index + 1);
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== "Backspace") return;
    if (value[index]) return;

    if (index > 0) {
      const next = value.slice(0, index - 1) + value.slice(index);
      onChange(next);
      focusBox(index - 1);
    }
  };

  return (
    <View
      className="flex-row justify-center gap-2"
      accessibilityRole="none"
      accessibilityLabel="Six-digit verification code"
    >
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] ?? "";
        return (
          <TextInput
            key={index}
            ref={(element) => {
              refs.current[index] = element;
            }}
            value={digit}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={(event) => handleKeyPress(index, event)}
            editable={editable}
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={length}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            textContentType={index === 0 ? "oneTimeCode" : "none"}
            autoCorrect={false}
            selectTextOnFocus
            accessibilityLabel={`Digit ${index + 1} of ${length}`}
            className={cn(
              "h-14 w-11 rounded-xl border bg-background text-center text-2xl font-bold text-foreground",
              hasError ? "border-danger" : "border-border",
              editable ? "" : "opacity-60",
            )}
            style={{ textAlign: "center" }}
          />
        );
      })}
    </View>
  );
}
