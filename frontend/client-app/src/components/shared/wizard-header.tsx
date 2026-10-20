import React from "react";
import { Pressable, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";

export interface WizardStep<T extends string> {
  key: T;
  label: string;
}

interface WizardHeaderProps<T extends string> {
  title: string;
  steps: WizardStep<T>[];
  activeStep: T;
  onBack: () => void;
}

export function WizardHeader<T extends string>({
  title,
  steps,
  activeStep,
  onBack,
}: WizardHeaderProps<T>) {
  const stepIndex = steps.findIndex((s) => s.key === activeStep);

  return (
    <View className="px-6 pt-4">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
        >
          <ArrowLeft size={18} color="#0F172A" />
        </Pressable>
        <Text variant="h3" weight="semibold">
          {title}
        </Text>
        <View className="h-10 w-10" />
      </View>

      <View className="mt-4 flex-row items-center gap-2">
        {steps.map((s, i) => (
          <View key={s.key} className="flex-1 items-center">
            <View
              className={`h-1.5 w-full rounded-full ${
                i <= stepIndex ? "bg-primary" : "bg-border"
              }`}
            />
            <Text
              variant="small"
              tone={i <= stepIndex ? "primary" : "muted"}
              className="mt-1.5"
            >
              {s.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
