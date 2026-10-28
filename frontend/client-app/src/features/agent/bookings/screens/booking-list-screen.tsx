import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { listBookingsForAgent } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import type { AgentStackParamList } from "@/app/navigation/types";

export function BookingListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentId = user?.agentId ?? "";

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listBookingsForAgent(agentId);
      setBookings(list);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const filtered = bookings.filter((b) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      b.customerName.toLowerCase().includes(q) ||
      b.reference.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
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
                  Bookings
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate("BookingCreate")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="New booking"
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
                placeholder="Search by customer or reference"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Search size={18} color="#64748B" />}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading bookings..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => void load()} />
          ) : (
            <EmptyState
              title="No bookings found"
              description={
                query
                  ? "Try a different search term."
                  : "Create your first booking to see it here."
              }
              actionLabel={query ? undefined : "New Booking"}
              onAction={
                query ? undefined : () => navigation.navigate("BookingCreate")
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("BookingDetail", { bookingId: item.id })
            }
            className="active:opacity-90"
          >
            <Card className="mb-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text weight="semibold">{item.customerName}</Text>
                  <Text variant="small" tone="muted" className="mt-0.5">
                    {item.reference} • {item.totalQuantity} item
                    {item.totalQuantity === 1 ? "" : "s"}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text variant="small" tone="muted">
                  {item.bookingDate}
                </Text>
                <Text weight="semibold" tone="primary">
                  ₱{item.totalAmount.toLocaleString()}
                </Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
