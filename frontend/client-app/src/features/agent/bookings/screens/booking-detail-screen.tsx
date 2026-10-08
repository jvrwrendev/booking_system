import React, { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { getBookingForAgent } from "@/services/booking.service";
import type { Booking } from "@/types/booking";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { AgentStackParamList } from "@/app/navigation/types";

export function BookingDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const route = useRoute<RouteProp<AgentStackParamList, "BookingDetail">>();
  const { user } = useAuth();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const b = await getBookingForAgent(
        route.params.bookingId,
        user?.agentId ?? "",
      );
      setBooking(b);
      if (!b) setError("Booking not found.");
    } catch {
      setError("Failed to load booking.");
    } finally {
      setLoading(false);
    }
  }, [route.params.bookingId, user?.agentId]);

  useEffect(() => {
    void load();
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
          <LoadingState label="Loading booking..." />
        ) : error || !booking ? (
          <ErrorState
            description={error ?? "Booking not found."}
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
                  {booking.reference}
                </Text>
              </View>
              <StatusBadge status={booking.status} />
            </View>

            <Card className="mt-6">
              <Text variant="label" tone="muted">
                CUSTOMER
              </Text>
              <Text weight="semibold" className="mt-1">
                {booking.customerName}
              </Text>
              <View className="mt-3 flex-row justify-between">
                <Text variant="small" tone="muted">
                  Booking date
                </Text>
                <Text variant="small" weight="medium">
                  {booking.bookingDate}
                </Text>
              </View>
              <View className="mt-1 flex-row justify-between">
                <Text variant="small" tone="muted">
                  Agent
                </Text>
                <Text variant="small" weight="medium">
                  {booking.agentName}
                </Text>
              </View>
            </Card>

            <Card className="mt-4">
              <Text variant="label" tone="muted">
                ITEMS
              </Text>
              {booking.items.map((item) => (
                <View
                  key={item.productId}
                  className="mt-3 flex-row items-center justify-between gap-3"
                >
                  <View className="flex-1">
                    <Text weight="medium">{item.productName}</Text>
                    <Text variant="small" tone="muted">
                      {item.sku} • ₱{item.unitPrice.toLocaleString()} ×{" "}
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
                  <Text tone="muted">Total quantity</Text>
                  <Text weight="semibold">{booking.totalQuantity}</Text>
                </View>
                <View className="mt-1 flex-row justify-between">
                  <Text weight="semibold">Total</Text>
                  <Text variant="h3" weight="bold" tone="primary">
                    ₱{booking.totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card>

            {booking.notes ? (
              <Card className="mt-4">
                <Text variant="label" tone="muted">
                  NOTES
                </Text>
                <Text className="mt-1">{booking.notes}</Text>
              </Card>
            ) : null}

            <Card className="mt-4">
              <Text variant="label" tone="muted">
                STATUS HISTORY
              </Text>
              <View className="mt-3">
                <StatusTimeline events={booking.statusHistory ?? []} />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
