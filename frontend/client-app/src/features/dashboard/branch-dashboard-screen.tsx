import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { listOrdersForBranch } from "@/services/branch-order.service";
import { listProducts } from "@/services/product.service";
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
    if (!branchId) return;
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
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter(
      (o) => o.status === "processing" || o.status === "assigned"
    ).length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const recent = [...orders]
    .sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
    .slice(0, 5);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="small" tone="muted">
            Welcome
          </Text>
          <Text variant="h1" weight="bold">
            {user?.fullName ?? "Branch"}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <StatCard label="Products" value={productCount} tone="primary" icon={<Boxes size={16} color="#16A34A" />} />
        <StatCard label="Orders" value={orders.length} tone="info" icon={<ShoppingBag size={16} color="#2563EB" />} />
      </View>
      <View className="flex-row gap-2 mt-2">
        <StatCard label="Pending" value={counts.pending} tone="warning" icon={<Clock size={16} color="#D97706" />} />
        <StatCard label="Processing" value={counts.processing} tone="info" icon={<PackageCheck size={16} color="#2563EB" />} />
        <StatCard label="Ready" value={counts.ready} tone="info" icon={<PackageCheck size={16} color="#2563EB" />} />
        <StatCard label="Completed" value={counts.completed} tone="success" icon={<CheckCircle2 size={16} color="#16A34A" />} />
      </View>

      <Card className="mt-4">
        <View className="flex-row items-center justify-between">
          <Text variant="semibold">Quick actions</Text>
          <Text variant="small" tone="muted" className="mt-0.5">Browse inventory and create a new order.</Text>
        </View>
        <View className="flex-row gap-2 mt-3">
          <Button label="Create Order" size="md" onPress={() => navigation.navigate("OrderReview")} className="flex-1" />
        </View>
      </Card>

      <View className="mt-6">
        <SectionHeader title="Recent Orders" subtitle="Latest orders from your branch" />
      </View>

      {loading ? (
        <LoadingState label="Loading orders..." />
      ) : recent.length === 0 ? (
        <EmptyState title="No orders yet" description="Create your first order from the inventory." actionLabel="Create Order" onAction={() => navigation.navigate("OrderReview")} />
      ) : (
        <View>
          {recent.map((o) => (
            <OrderCard key={o.id} order={o} onPress={() => navigation.navigate("OrderDetail", { orderId: o.id })} />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}