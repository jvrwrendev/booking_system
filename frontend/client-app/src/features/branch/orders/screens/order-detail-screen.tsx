import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { getOrderForBranch } from "@/services/branch-order.service";
import type { BranchOrder } from "@/types/branch-order";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import type { BranchStackParamList } from "@/app/navigation/types";

export function OrderDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const route = useRoute<RouteProp<BranchStackParamList, "OrderDetail">>();
  const { user } = useAuth();

  const [order, setOrder] = useState<BranchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const o = await getOrderForBranch(
        route.params.orderId,
        user?.branchId ?? "",
      );
      setOrder(o);
      if (!o) setError("Order not found.");
    } catch (loadError) {
      setError(
        loadError instanceof Error && loadError.message
          ? loadError.message
          : "Failed to load order.",
      );
    } finally {
      setLoading(false);
    }
  }, [route.params.orderId, user]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
        >
          <ArrowLeft size={18} color="#0F172A" />
        </Pressable>

        {loading ? (
          <LoadingState label="Loading order..." />
        ) : error || !order ? (
          <ErrorState
            description={error ?? "Order not found."}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <View className="flex-row items-center justify-between">
              <View>
                <Text variant="small" tone="muted">
                  Reference
                </Text>
                <Text variant="h2" weight="bold">
                  {order.reference}
                </Text>
              </View>
              <StatusBadge status={order.status} />
            </View>

            <Card className="mt-6">
              <Text variant="label" tone="muted">
                BRANCH ORDER
              </Text>
              <Text weight="semibold" className="mt-1">
                {order.branchName}
              </Text>
              <View className="mt-3 flex-row justify-between">
                <Text variant="small" tone="muted">
                  Order date
                </Text>
                <Text variant="small" weight="medium">
                  {order.orderDate}
                </Text>
              </View>
              <View className="mt-1 flex-row justify-between">
                <Text variant="small" tone="muted">
                  Total quantity
                </Text>
                <Text variant="small" weight="medium">
                  {order.totalQuantity}
                </Text>
              </View>
              {order.assignedAdminName ? (
                <View className="mt-1 flex-row justify-between">
                  <Text variant="small" tone="muted">
                    Assigned to
                  </Text>
                  <Text variant="small" weight="medium">
                    {order.assignedAdminName}
                  </Text>
                </View>
              ) : null}
            </Card>

            {order.status === "pending" ? (
              <Card className="mt-4">
                <Text variant="label" tone="muted">
                  ORDER PENDING
                </Text>
                <Text variant="small" tone="muted" className="mt-1">
                  A system administrator will review and accept this order.
                </Text>
              </Card>
            ) : null}

            <Card className="mt-4">
              <Text variant="label" tone="muted">
                ITEMS
              </Text>
              {order.items.map((item) => (
                <View
                  key={item.productId}
                  className="mt-3 flex-row items-center justify-between gap-3"
                >
                  <View className="flex-1">
                    <Text weight="medium">{item.productName}</Text>
                    <Text variant="small" tone="muted">
                      {item.sku} · ₱{item.unitPrice.toLocaleString()} ×{" "}
                      {item.quantity}
                    </Text>
                  </View>
                  <Text weight="semibold">
                    ₱{item.subtotal.toLocaleString()}
                  </Text>
                </View>
              ))}
              <View className="mt-4 border-t border-border pt-3">
                <View className="flex-row justify-between">
                  <Text tone="muted">Subtotal</Text>
                  <Text weight="semibold">
                    ₱{order.subtotal.toLocaleString()}
                  </Text>
                </View>
                {order.discount > 0 ? (
                  <View className="mt-1 flex-row justify-between">
                    <Text tone="muted">Discount</Text>
                    <Text weight="medium" tone="danger">
                      −₱{order.discount.toLocaleString()}
                    </Text>
                  </View>
                ) : null}
                <View className="mt-1 flex-row justify-between">
                  <Text weight="semibold">Total</Text>
                  <Text variant="h3" weight="bold" tone="primary">
                    ₱{order.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>

            {order.notes ? (
              <Card className="mt-4">
                <Text variant="label" tone="muted">
                  NOTES
                </Text>
                <Text className="mt-1">{order.notes}</Text>
              </Card>
            ) : null}

            <Card className="mt-4">
              <Text variant="label" tone="muted">
                STATUS HISTORY
              </Text>
              <View className="mt-3">
                <StatusTimeline events={order.statusHistory ?? []} />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
