import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { listOrdersForBranch } from "@/services/branch-order.service";
import type { BranchOrder } from "@/types/branch-order";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { OrderCard } from "@/components/shared/order-card";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import type { BranchStackParamList } from "@/app/navigation/types";

export function OrderListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const { user } = useAuth();

  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchId = user?.branchId ?? "";

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listOrdersForBranch(branchId);
      setOrders(list);
    } catch {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [branchId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const filtered = orders.filter((o) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      o.reference.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.branchName.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16A34A"
          />
        }
        ListHeaderComponent={
          <View className="mb-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text variant="small" tone="muted">
                  Manage
                </Text>
                <Text variant="h1" weight="bold">
                  Orders
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate("OrderCreate")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="New order"
                className="h-10 w-10 items-center justify-center rounded-full bg-primary active:opacity-80"
              >
                <Plus size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            <View className="mt-4">
              <Input
                size="control"
                value={query}
                onChangeText={setQuery}
                placeholder="Search by reference or status"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Search size={18} color="#64748B" />}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading orders..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => void load()} />
          ) : (
            <EmptyState
              title="No orders found"
              description={
                query
                  ? "Try a different search term."
                  : "Create your first branch order to see it here."
              }
              actionLabel={query ? undefined : "Create Order"}
              onAction={
                query ? undefined : () => navigation.navigate("OrderCreate")
              }
            />
          )
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() =>
              navigation.navigate("OrderDetail", { orderId: item.id })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}
