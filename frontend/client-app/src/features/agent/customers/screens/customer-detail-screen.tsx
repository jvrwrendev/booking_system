import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { getCustomerForAgent } from "@/services/customer.service";
import type { Customer } from "@/types/customer";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import type { AgentStackParamList } from "@/app/navigation/types";

export function CustomerDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const route = useRoute<RouteProp<AgentStackParamList, "CustomerDetail">>();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await getCustomerForAgent(
        route.params.customerId,
        user?.agentId ?? "",
      );
      setCustomer(c);
      if (!c) setError("Customer not found.");
    } catch {
      setError("Failed to load customer.");
    } finally {
      setLoading(false);
    }
  }, [route.params.customerId, user?.agentId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
      >
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
          <LoadingState label="Loading customer..." />
        ) : error || !customer ? (
          <ErrorState
            description={error ?? "Customer not found."}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserRound size={28} color="#16A34A" />
              </View>
              <Text variant="h1" weight="bold" className="mt-4 text-center">
                {customer.fullName}
              </Text>
              <View className="mt-2">
                <Badge
                  label={customer.status}
                  tone={customer.status === "active" ? "success" : "muted"}
                />
              </View>
            </View>

            <Card className="mt-6 gap-4">
              <View className="flex-row items-center gap-3">
                <Mail size={16} color="#64748B" />
                <Text className="flex-1">{customer.email}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Phone size={16} color="#64748B" />
                <Text className="flex-1">{customer.contactNumber}</Text>
              </View>
              <View className="flex-row items-start gap-3">
                <MapPin size={16} color="#64748B" style={{ marginTop: 2 }} />
                <Text className="flex-1">{customer.address}</Text>
              </View>
            </Card>

            <View className="mt-4 flex-row gap-3">
              <Card className="flex-1">
                <Text variant="small" tone="muted">
                  Bookings
                </Text>
                <Text variant="h2" weight="bold" tone="primary" className="mt-1">
                  {customer.totalBookings}
                </Text>
              </Card>
              <Card className="flex-1">
                <Text variant="small" tone="muted">
                  Total Purchases
                </Text>
                <Text variant="h2" weight="bold" className="mt-1">
                  ₱{customer.totalPurchases.toLocaleString()}
                </Text>
              </Card>
            </View>

            {customer.notes ? (
              <Card className="mt-4">
                <Text variant="small" tone="muted">
                  Notes
                </Text>
                <Text className="mt-1">{customer.notes}</Text>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
