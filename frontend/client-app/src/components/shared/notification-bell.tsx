import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Bell, Inbox, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";

export type NotificationTone =
  | "primary"
  | "warning"
  | "info"
  | "danger"
  | "muted";

export interface NotificationItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  tone?: NotificationTone;
  unread?: boolean;
}

const toneDotClass: Record<NotificationTone, string> = {
  primary: "bg-primary",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-danger",
  muted: "bg-muted-foreground",
};

const toneIconBgClass: Record<NotificationTone, string> = {
  primary: "bg-primary/10",
  warning: "bg-warning/10",
  info: "bg-info/10",
  danger: "bg-danger/10",
  muted: "bg-muted",
};

interface NotificationBellProps {
  items: NotificationItem[];
  className?: string;
  onPressItem?: (item: NotificationItem) => void;
}

export function NotificationBell({
  items,
  className,
  onPressItem,
}: NotificationBellProps) {
  const [visible, setVisible] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);

  const isRead = (item: NotificationItem) =>
    item.unread === false || readIds.includes(item.id);

  const unreadCount = useMemo(
    () => items.filter((item) => !isRead(item)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, readIds],
  );

  const badgeLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  const onPressNotification = (item: NotificationItem) => {
    if (!isRead(item)) {
      setReadIds((prev) =>
        prev.includes(item.id) ? prev : [...prev, item.id],
      );
    }
    setVisible(false);
    onPressItem?.(item);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${unreadCount} unread`}
        className={`relative h-10 w-10 items-center justify-center rounded-full border border-border bg-background active:opacity-70 ${
          className ?? ""
        }`}
      >
        <Bell size={18} color="#0F172A" />
        {unreadCount > 0 ? (
          <View className="absolute -right-0.5 -top-0.5 min-w-[18px] items-center rounded-full border-2 border-background bg-destructive px-[3px]">
            <Text
              variant="small"
              weight="bold"
              className="text-[9px] leading-[14px] text-white"
            >
              {badgeLabel}
            </Text>
          </View>
        ) : null}
      </Pressable>

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          onPress={() => setVisible(false)}
          className="flex-1 justify-start bg-black/40 px-4 pt-20"
        >
          <Pressable
            onPress={() => {}}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-background"
            style={{ shadowColor: "#0F172A", shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
          >
            <View className="flex-row items-center justify-between px-4 py-3.5">
              <View className="flex-row items-center gap-2">
                <Text variant="h3" weight="semibold">
                  Notifications
                </Text>
                {unreadCount > 0 ? (
                  <View className="rounded-full bg-destructive/10 px-2 py-0.5">
                    <Text
                      variant="small"
                      weight="semibold"
                      className="text-destructive"
                    >
                      {badgeLabel} new
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={() => setVisible(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
                className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            <Divider />

            {items.length === 0 ? (
              <View className="items-center px-6 py-10">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Inbox size={22} color="#64748B" />
                </View>
                <Text weight="semibold">You're all caught up</Text>
                <Text variant="small" tone="muted" className="mt-1 text-center">
                  New activity will show up here.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 360 }}
                showsVerticalScrollIndicator={false}
              >
                {items.map((item, index) => {
                  const tone = item.tone ?? "primary";
                  const read = isRead(item);
                  return (
                    <View key={item.id}>
                      {index > 0 ? (
                        <Divider className="bg-border/60" />
                      ) : null}
                      <Pressable
                        onPress={() => onPressNotification(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Open notification: ${item.title}`}
                        className={`flex-row items-start gap-3 px-4 py-3.5 active:bg-secondary ${
                          read ? "" : "bg-primary/5"
                        }`}
                      >
                        <View
                          className={`mt-0.5 h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneIconBgClass[tone]}`}
                        >
                          <View
                            className={`h-2 w-2 rounded-full ${toneDotClass[tone]}`}
                          />
                        </View>
                        <View className="flex-1 pr-1">
                          <View className="flex-row items-center gap-2">
                            <Text
                              variant="small"
                              weight="semibold"
                              className="flex-1"
                              numberOfLines={1}
                            >
                              {item.title}
                            </Text>
                            {!read ? (
                              <View className="h-2 w-2 rounded-full bg-destructive" />
                            ) : null}
                          </View>
                          {item.description ? (
                            <Text
                              variant="small"
                              tone="muted"
                              className="mt-0.5"
                              numberOfLines={2}
                            >
                              {item.description}
                            </Text>
                          ) : null}
                          {item.time ? (
                            <Text
                              variant="small"
                              tone="muted"
                              className="mt-1 text-[10px] opacity-70"
                            >
                              {item.time}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
