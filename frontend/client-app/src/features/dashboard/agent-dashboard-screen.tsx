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
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/shared/notification-bell";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { formatDateTime } from "@/lib/utils";

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

  const todaysBookings = useMemo(() => {
    const today = new Date().toDateString();
    return bookings.filter(
      (b) => new Date(b.bookingDate || b.createdAt).toDateString() === today,
    ).length;
  }, [bookings]);

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending").length,
    [bookings],
  );

  const statCards = [
    { label: "Today's Bookings", value: todaysBookings, color: "#16A34A" },
    { label: "Pending Bookings", value: pendingBookings, color: "#D97706" },
    { label: "Customers", value: customerCount, color: "#2563EB" },
    { label: "Total Bookings", value: bookings.length, color: "#0F172A" },
  ];

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    if (pendingBookings > 0) {
      items.push({
        id: "pending-bookings",
        title: "Pending bookings",
        description: `${pendingBookings} booking${pendingBookings === 1 ? "" : "s"} awaiting your confirmation.`,
        tone: "warning",
      });
    }

    recent.slice(0, 4).forEach((booking) => {
      items.push({
        id: booking.id,
        title: booking.reference,
        description: `${booking.customerName} · ${booking.status}`,
        time: formatDateTime(booking.createdAt),
        tone:
          booking.status === "pending"
            ? "warning"
            : booking.status === "ready" || booking.status === "completed"
              ? "primary"
              : "info",
      });
    });

    if (items.length === 0) {
      items.push({
        id: "all-clear",
        title: "You're all caught up",
        description: "No recent activity on your bookings.",
        tone: "muted",
        unread: false,
      });
    }

    return items;
  }, [pendingBookings, recent]);

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
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text variant="small" tone="muted">
                  Welcome back
                </Text>
                <Text variant="h1" weight="bold">
                  {user?.fullName ?? "Agent"}
                </Text>
              </View>
              <NotificationBell items={notifications} />
            </View>

            <View className="mt-5 flex-row flex-wrap gap-3">
              {statCards.map((stat) => (
                <Card key={stat.label} className="min-w-[45%] flex-1">
                  <View
                    style={{ backgroundColor: stat.color }}
                    className="mb-3 h-1 w-8 rounded-full"
                  />
                  <Text variant="small" tone="muted">
                    {stat.label}
                  </Text>
                  <Text variant="h2" weight="bold" className="mt-1" style={{ color: stat.color }}>
                    {stat.value}
                  </Text>
                </Card>
              ))}
            </View>

            <View className="mt-5">
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
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text weight="semibold">{item.customerName}</Text>
                <Text variant="small" tone="muted" className="mt-0.5">
                  {item.reference}
                </Text>
              </View>
              <Text weight="semibold" tone="primary">
                {item.status}
              </Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}