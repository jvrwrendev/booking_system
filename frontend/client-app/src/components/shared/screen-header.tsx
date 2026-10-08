import React from "react";
import { Pressable, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { Text } from "@/components/ui/text";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ScreenHeader({
  title,
  subtitle,
  action,
  className,
}: ScreenHeaderProps) {
  const navigation = useNavigation();

  return (
    <View className={`flex-row items-center gap-3 mb-6 ${className ?? ""}`}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        className="h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background active:opacity-70"
      >
        <ArrowLeft size={18} color="#0F172A" />
      </Pressable>
      <View className="flex-1">
        <Text variant="h3" weight="semibold" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            variant="small"
            tone="muted"
            className="mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
