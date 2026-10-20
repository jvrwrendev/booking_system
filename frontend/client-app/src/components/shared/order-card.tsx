import React from "react";
import { Pressable, View } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { StatusBadge } from "./status-badge";
import type { BranchOrder } from "@/types/branch-order";

interface OrderCardProps {
  order: BranchOrder;
  onPress?: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card className="mb-2">
        <View className="flex-row items-center justify-between">
          <Text weight="semibold">{order.reference}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text variant="small" tone="muted" className="mt-1">
          {order.branchName} &middot; {order.totalQuantity} item
          {order.totalQuantity === 1 ? "" : "s"}
        </Text>
        <Text variant="title" weight="bold" tone="primary" className="mt-2">
          {order.totalAmount.toFixed(2)}
        </Text>
      </Card>
    </Pressable>
  );
}