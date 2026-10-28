import React, {
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Platform,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputInstance,
  type TextInputKeyPressEvent,
  type TextStyle,
} from "react-native";
import { cn } from "@/lib/utils";

const DEFAULT_LENGTH = 6;

// React Native Web draws a native focus ring that sits on top of the rounded
// focus border, so the box looks black instead of green. Inline styles beat
// the :focus pseudo-class and remove it on web only.
const removeWebFocusRing =
  Platform.OS === "web"
    ? ({ outlineStyle: "none" } as unknown as TextStyle)
    : undefined;

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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [scales] = useState(() =>
    Array.from({ length }, () => new Animated.Value(1)),
  );
  const [shake] = useState(() => new Animated.Value(0));
  const completedRef = useRef(false);
  const { width } = useWindowDimensions();

  // The screen uses 24px side padding and the verification panel 20px padding,
  // so this is the horizontal room the six boxes actually have.
  const availableWidth = Math.min(width - 48, 440) - 40;
  const gap = width < 370 ? 6 : 8;
  const separatorWidth = gap + 6;
  const boxWidth = Math.max(
    30,
    Math.min(
      52,
      Math.floor((availableWidth - separatorWidth - gap * (length - 1)) / length),
    ),
  );
  const boxHeight = boxWidth + 10;
  const fontSize = Math.round(boxWidth * 0.48);

  const inputRefs = useMemo(
    () => Array.from({ length }, () => createRef<TextInputInstance>()),
    [length],
  );

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRefs[0]?.current?.focus(), 180);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, inputRefs]);

  useEffect(() => {
    if (focusKey > 0) inputRefs[0]?.current?.focus();
  }, [focusKey, inputRefs]);

  useEffect(() => {
    if (value.length < length) completedRef.current = false;
  }, [value, length]);

  // A short horizontal shake communicates a rejected code without an alert.
  useEffect(() => {
    if (!hasError) return;
    shake.setValue(0);
    Animated.sequence(
      [10, -9, 7, -5, 3, 0].map((toValue) =>
        Animated.timing(shake, {
          toValue,
          duration: 55,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [hasError, shake]);

  const animateBox = (index: number, toValue: number) => {
    const scale = scales[index];
    if (!scale) return;
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 26,
      bounciness: 7,
    }).start();
  };

  const focusBox = (index: number) => {
    const target = Math.min(Math.max(index, 0), length - 1);
    inputRefs[target]?.current?.focus();
  };

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length && !completedRef.current) {
      completedRef.current = true;
      onComplete?.(next);
    }
  };

  const handleChange = (index: number, raw: string) => {
    const digits = digitsOnly(raw);

    if (digits.length === 0) {
      commit(value.slice(0, index) + value.slice(index + 1));
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
    event: TextInputKeyPressEvent,
  ) => {
    if (event.nativeEvent.key !== "Backspace" || value[index]) return;
    if (index > 0) {
      onChange(value.slice(0, index - 1) + value.slice(index));
      focusBox(index - 1);
    }
  };

  return (
    <Animated.View
      style={{ transform: [{ translateX: shake }] }}
      accessibilityRole="none"
      accessibilityLabel={`${length}-digit verification code`}
    >
      <View
        style={{ gap }}
        className="flex-row items-center justify-center"
      >
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] ?? "";
          const isFocused = focusedIndex === index;
          const isComplete = value.length === length;

          return (
            <React.Fragment key={index}>
              {index === 3 ? (
                <View
                  style={{ width: separatorWidth, height: 2 }}
                  className="rounded-full bg-border"
                />
              ) : null}
              <Animated.View
                style={{ transform: [{ scale: scales[index] ?? 1 }] }}
              >
                <TextInput
                  ref={inputRefs[index]}
                  value={digit}
                  onChangeText={(text) => handleChange(index, text)}
                  onKeyPress={(event) => handleKeyPress(index, event)}
                  onFocus={() => {
                    setFocusedIndex(index);
                    animateBox(index, 1.05);
                  }}
                  onBlur={() => {
                    setFocusedIndex((current) =>
                      current === index ? null : current,
                    );
                    animateBox(index, 1);
                  }}
                  editable={editable}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={length}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoCorrect={false}
                  selectTextOnFocus
                  selectionColor="#16A34A"
                  accessibilityLabel={`Digit ${index + 1} of ${length}`}
                  style={[
                    {
                      width: boxWidth,
                      height: boxHeight,
                      fontSize,
                      textAlign: "center",
                    },
                    removeWebFocusRing,
                  ]}
                  className={cn(
                    "rounded-2xl border-2 bg-background font-bold text-foreground shadow-sm outline-none",
                    hasError
                      ? "border-danger/70 bg-danger/5"
                      : isComplete
                        ? "border-primary/50 bg-primary/5"
                        : isFocused
                          ? "border-primary bg-background"
                          : digit
                            ? "border-foreground/25"
                            : "border-border",
                    editable ? "" : "opacity-50",
                  )}
                />
              </Animated.View>
            </React.Fragment>
          );
        })}
      </View>
    </Animated.View>
  );
}
