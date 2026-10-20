import React from "react";
import { View } from "react-native";
import { PackageX } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View
      className={`items-center justify-center px-6 py-12 ${className ?? ""}`}
    >
      <View className="h-14 w-14 rounded-full bg-muted items-center justify-center mb-3">
        {icon ?? <PackageX size={24} color="#64748B" />}
      </View>
      <Text weight="semibold" className="text-center">
        {title}
      </Text>
      {description && (
        <Text variant="small" tone="muted" className="mt-1 text-center">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          className="mt-4"
        />
      )}
    </View>
  );
}
