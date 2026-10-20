import React from "react";
import { Modal, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        className="flex-1 bg-black/40 items-center justify-center px-5"
      >
        <Pressable
          onPress={() => {}}
          className="w-full max-w-md rounded-lg bg-background border border-border"
        >
          <View className="p-5">
            <Text variant="h3" weight="semibold">
              {title}
            </Text>
            {description && (
              <Text variant="small" tone="muted" className="mt-1.5">
                {description}
              </Text>
            )}
          </View>
          <Divider />
          <View className="flex-row p-3 gap-2">
            <Button
              label={cancelLabel}
              variant="outline"
              onPress={onCancel}
              fullWidth
              className="flex-1"
            />
            <Button
              label={confirmLabel}
              variant={destructive ? "destructive" : "primary"}
              onPress={onConfirm}
              fullWidth
              className="flex-1"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
