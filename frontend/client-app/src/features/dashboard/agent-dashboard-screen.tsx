import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus } from "lucide-react-native";
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
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

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
    void (async () => {
      await load();
    })();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const recent = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [bookings],
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={recent}
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
            <Text variant="small" tone="muted">
              Welcome back
            </Text>
            <Text variant="h1" weight="bold">
              {user?.fullName ?? "Agent"}
            </Text>

            <View className="flex-row gap-2 mt-4">
              <Card className="flex-1">
                <Text variant="small" tone="muted">
                  Customers
                </Text>
                <Text variant="h2" weight="bold" tone="primary" className="mt-1">
                  {customerCount}
                </Text>
              </Card>
              <Card className="flex-1">
                <Text variant="small" tone="muted">
                  Bookings
                </Text>
                <Text variant="h2" weight="bold" tone="info" className="mt-1">
                  {bookings.length}
                </Text>
              </Card>
            </View>

            <View className="mt-4">
              <Button
                label="New Booking"
                size="md"
                leftIcon={<Plus size={16} color="#FFFFFF" />}
                onPress={() => navigation.navigate("BookingCreate")}
              />
            </View>

            <View className="mt-6">
              <SectionHeader
                title="Recent Bookings"
                subtitle="Latest transactions you created"
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
              title="No bookings yet"
              description="Create your first booking to see it here."
              actionLabel="Create Booking"
              onAction={() => navigation.navigate("BookingCreate")}
            />
          )
        }
        renderItem={({ item }) => (
          <Card className="mb-2">
            <Text weight="semibold">{item.customerName}</Text>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}