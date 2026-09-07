import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "@/components/ui/text";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Loading...",
  className,
}: LoadingStateProps) {
  return (
    <View
      className={`items-center justify-center py-10 ${className ?? ""}`}
    >
      <ActivityIndicator color="#16A34A" />
      <Text variant="small" tone="muted" className="mt-2">
        {label}
      </Text>
    </View>
  );
}
