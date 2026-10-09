import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Boxes, ShoppingBag, Clock, PackageCheck, CheckCircle2 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { SectionHeader } from "@/components/ui/section-header";
import { Button } from "@/components/ui/button";
import { OrderCard } from "@/components/shared/order-card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/shared/notification-bell";
import { listOrdersForBranch } from "@/services/branch-order.service";
import { listProducts } from "@/services/product.service";
import { formatDateTime } from "@/lib/utils";
import type { BranchOrder } from "@/types/branch-order";
import type { BranchStackParamList } from "@/app/navigation/types";

export function BranchDashboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const { user } = useAuth();

  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const branchId = user?.branchId ?? "";

  const load = useCallback(async () => {
    if (!branchId) {
      setLoading(false);
      return;
    }
    const [o, p] = await Promise.all([
      listOrdersForBranch(branchId),
      listProducts(),
    ]);
    setOrders(o);
    setProductCount(p.length);
    setLoading(false);
    setRefreshing(false);
  }, [branchId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter(
        (o) => o.status === "processing" || o.status === "assigned",
      ).length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
    }),
    [orders],
  );

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [orders],
  );

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    if (counts.pending > 0) {
      items.push({
        id: "pending-orders",
        title: "Pending orders",
        description: `${counts.pending} order${counts.pending === 1 ? "" : "s"} waiting to be processed.`,
        tone: "warning",
      });
    }

    if (counts.ready > 0) {
      items.push({
        id: "ready-orders",
        title: "Orders ready",
        description: `${counts.ready} order${counts.ready === 1 ? "" : "s"} ready for pickup or delivery.`,
        tone: "primary",
      });
    }

    recent.slice(0, 3).forEach((order) => {
      items.push({
        id: order.id,
        title: order.reference,
        description: `${order.totalQuantity} item${order.totalQuantity === 1 ? "" : "s"} · ${order.status}`,
        time: formatDateTime(order.createdAt),
        tone:
          order.status === "pending"
            ? "warning"
            : order.status === "ready"
              ? "primary"
              : "info",
      });
    });

    if (items.length === 0) {
      items.push({
        id: "all-clear",
        title: "You're all caught up",
        description: "No recent activity on your orders.",
        tone: "muted",
        unread: false,
      });
    }

    return items;
  }, [counts, recent]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16A34A"
          />
        }
      >
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text variant="small" tone="muted">
              Welcome
            </Text>
            <Text variant="h1" weight="bold">
              {user?.fullName ?? "Branch"}
            </Text>
          </View>
          <NotificationBell items={notifications} />
        </View>

        <View className="flex-row gap-2">
          <StatCard
            label="Products"
            value={productCount}
            tone="primary"
            icon={<Boxes size={16} color="#16A34A" />}
          />
          <StatCard
            label="Orders"
            value={orders.length}
            tone="info"
            icon={<ShoppingBag size={16} color="#2563EB" />}
          />
        </View>
        <View className="flex-row gap-2 mt-2">
          <StatCard
            label="Pending"
            value={counts.pending}
            tone="warning"
            icon={<Clock size={16} color="#D97706" />}
          />
          <StatCard
            label="Processing"
            value={counts.processing}
            tone="info"
            icon={<PackageCheck size={16} color="#2563EB" />}
          />
          <StatCard
            label="Ready"
            value={counts.ready}
            tone="info"
            icon={<PackageCheck size={16} color="#2563EB" />}
          />
          <StatCard
            label="Completed"
            value={counts.completed}
            tone="success"
            icon={<CheckCircle2 size={16} color="#16A34A" />}
          />
        </View>

        <Card className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text weight="semibold">Quick actions</Text>
            <Text variant="small" tone="muted" className="mt-0.5">
              Browse inventory and create a new order.
            </Text>
          </View>
          <View className="flex-row gap-2 mt-3">
            <Button
              label="Create Order"
              size="md"
              className="flex-1"
              onPress={() => navigation.navigate("OrderCreate")}
            />
          </View>
        </Card>

        <View className="mt-6">
          <SectionHeader
            title="Recent Orders"
            subtitle="Latest orders from your branch"
          />
        </View>

        {loading ? (
          <LoadingState label="Loading orders..." />
        ) : recent.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Create your first order from the inventory."
            actionLabel="Create Order"
            onAction={() => navigation.navigate("OrderCreate")}
          />
        ) : (
          <View>
            {recent.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                onPress={() =>
                  navigation.navigate("OrderDetail", { orderId: o.id })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
