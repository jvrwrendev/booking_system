import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, FlatList, View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { listBookingsForAgent } from "@/services/booking.service";
import { listCustomersForAgent } from "@/services/customer.service";
import type { Booking } from "@/types/booking";
import type { AgentStackParamList } from "@/app/navigation/types";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";

export function AgentDashboardScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentId = user?.agentId ?? "";

  const load = useCallback(async () => {
    setError(null);
    try {
      const [b, c] = await Promise.all([
        listBookingsForAgent(agentId),
        listCustomersForAgent(agentId),
      ]);
      setBookings(b);
      setCustomerCount(c.length);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const recent = [...bookings]
    .sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
    .slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1">
            <Text variant="small" tone="muted">
              Welcome back
            </Text>
            <Text variant="h1" weight="bold">
              {user?.fullName ?? "Agent"}
            </Text>
          </View>
          <Button
            label="New"
            size="sm"
            leftIcon={<Text variant="small">➕</Text>}
            onPress={() => navigation.navigate("BookingCreate")}
          />
        </View>
      </View>

      <View className="p-2 border-t border-gray-200">
        <View className="flex-row gap-2 mb-2">
          <Text variant="semibold">Customers</Text>
          <Text variant="small" tone="muted">{customerCount}</Text>
        </View>
        <View className="flex-row gap-2 mb-3">
          <Text variant="semibold">Bookings</Text>
          <Text variant="small" tone="info">{bookings.length}</Text>
        </View>
      </View>

      <View className="p-4">
        <Text variant="h2" weight="bold">Recent Bookings</Text>
        <Text variant="small" tone="muted" className="mb-2">
          Latest transactions you created
        </Text>
      </View>

      {loading ? (
        <LoadingState label="Loading bookings..." />
      ) : error ? (
        <ErrorState description={error} onRetry={load} />
      ) : recent.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          description="Create your first booking to see it here."
          actionLabel="Create Booking"
          onAction={() => navigation.navigate("BookingCreate")}
        />
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#16A34A"
            }
          }
          ListEmptyComponent={
            <EmptyState
              title="No bookings yet"
              description="Try a different filter or search."
              actionLabel="Create Booking"
              onAction={() => navigation.navigate("BookingCreate")}
            />
          }
          renderItem={({ item }) => (
            <Text>{item.customerName}</Text>
          )}
        </FlatList>
      )}
    </View>
  );
}