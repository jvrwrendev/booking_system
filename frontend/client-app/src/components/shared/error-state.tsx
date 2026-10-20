import React from "react";
import { AlertTriangle } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <View
      className={`items-center justify-center px-6 py-10 ${className ?? ""}`}
    >
      <View className="h-12 w-12 rounded-full bg-danger/10 items-center justify-center mb-3">
        <AlertTriangle size={22} color="#DC2626" />
      </View>
      <Text weight="semibold" className="text-center">
        {title}
      </Text>
      <Text variant="small" tone="muted" className="mt-1 text-center">
        {description}
      </Text>
      {onRetry && (
        <Button
          label="Try again"
          onPress={onRetry}
          variant="outline"
          className="mt-4"
        />
      )}
    </View>
  );
}
