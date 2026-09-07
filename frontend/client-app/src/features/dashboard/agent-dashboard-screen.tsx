import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, FlatList, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { CustomerCard } from "@/components/shared/customer-card";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { listBookingsForAgent } from "@/services/booking.service";
import { listCustomersForAgent } from "@/services/customer.service";
import type { Booking } from "@/types/booking";
import type { AgentStackParamList } from "@/app/navigation/types";

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

  const counts = {
    pending: bookings.filter((b) => b.status === "pending").length,
    processing: bookings.filter(
      (b) => b.status === "processing" || b.status === "assigned"
    ).length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  const recent = [...bookings]
    .sort((a, b) => a.createdAt < b.createdAt ? 1 : -1)
    .slice(0, 5);

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-3 pb-2">
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

      <View className="flex-row gap-2">
        <Text variant="semibold">Customers</Text>
        <Text variant="small" tone="muted">{customerCount}</Text>
      </View>
      <View className="flex-row gap-2 mt-1">
        <Text variant="semibold">Bookings</Text>
        <Text variant="small" tone="info">{bookings.length}</Text>
      </View>
    </View>

    <View className="mt-4">
      <Text variant="h2" weight="bold">Recent Bookings</Text>
      <Text variant="small" tone="muted" className="mt-1">
        Latest transactions you created
      </Text>
    </View>

    {loading ? (
      <LoadingState label="Loading bookings..." />
    ) : error ? (
      <ErrorState description={error} onRetry={load} />
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
            title={
              recent.length === 0
                ? "No bookings yet"
                : "No bookings yet"
            }
            description={
              recent.length === 0
                ? "Create your first booking to see it here."
                : "Try a different filter or search."
            }
            actionLabel={recent.length === 0 ? "Create Booking" : undefined}
            onAction={recent.length === 0 ? () => navigation.navigate("BookingCreate") : undefined}
          />
        }
        renderItem={({ item }) => (
          <CustomerCard
            customer={{
              id: item.id,
              fullName: item.customerName,
              contactNumber: "—",
              email: "—",
              address: "—",
              status: "active",
              totalBookings: 0,
              registeredDate: item.createdAt,
              notes: "",
              ...item,
            }}
            onPress={() =>
              navigation.navigate("CustomerDetail", { customerId: item.id })
            }
          />
        )}
      </FlatList>
    </View>
  );
}