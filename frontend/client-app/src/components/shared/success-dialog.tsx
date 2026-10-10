import React from "react";
import { Modal, View, Pressable } from "react-native";
import { Check } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

interface SuccessDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  referenceLabel?: string;
  reference?: string | null;
  confirmLabel?: string;
  onConfirm: () => void;
}

export function SuccessDialog({
  visible,
  title,
  description,
  referenceLabel = "Reference number",
  reference,
  confirmLabel = "Done",
  onConfirm,
}: SuccessDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <Pressable
        onPress={onConfirm}
        className="flex-1 items-center justify-center bg-black/40 px-5"
      >
        <Pressable
          onPress={() => {}}
          className="w-full max-w-md rounded-lg border border-border bg-background"
        >
          <View className="items-center p-5">
            <View className="h-14 w-14 items-center justify-center rounded-full border border-success/30 bg-success/10">
              <Check size={28} color="#16A34A" strokeWidth={2.5} />
            </View>
            <Text variant="h3" weight="semibold" className="mt-3 text-center">
              {title}
            </Text>
            {description ? (
              <Text variant="small" tone="muted" className="mt-1.5 text-center leading-5">
                {description}
              </Text>
            ) : null}
            {reference ? (
              <View className="mt-4 w-full items-center rounded-md border border-border bg-secondary px-3 py-2.5">
                <Text variant="label" tone="muted">
                  {referenceLabel}
                </Text>
                <Text
                  variant="title"
                  weight="bold"
                  className="mt-0.5 tracking-wide"
                >
                  {reference}
                </Text>
              </View>
            ) : null}
          </View>
          <Divider />
          <View className="p-3">
            <Button label={confirmLabel} fullWidth onPress={onConfirm} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
