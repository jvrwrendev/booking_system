import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";

interface PlaceholderScreenProps {
  title: string;
  description?: string;
}

export function PlaceholderScreen({
  title,
  description = "This screen has not been implemented yet.",
}: PlaceholderScreenProps) {
  return (
    <View className="flex-1 bg-background p-4">
      <Card className="items-center py-10">
        <Text variant="h2" weight="bold">
          {title}
        </Text>
        <Text variant="small" tone="muted" className="mt-2 text-center">
          {description}
        </Text>
      </Card>
    </View>
  );
}