import React, { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Search, UserRound } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { listCustomersForAgent } from "@/services/customer.service";
import type { Customer } from "@/types/customer";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AgentStackParamList } from "@/app/navigation/types";

export function CustomerListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agentId = user?.agentId ?? "";

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listCustomersForAgent(agentId);
      setCustomers(list);
    } catch {
      setError("Failed to load customers.");
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

  const filtered = customers.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.contactNumber.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
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
                  Customers
                </Text>
              </View>
              <Pressable
                onPress={() => navigation.navigate("CustomerAdd")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add customer"
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
                placeholder="Search by name, email, or contact"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Search size={18} color="#64748B" />}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading customers..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => void load()} />
          ) : (
            <EmptyState
              title="No customers found"
              description={
                query
                  ? "Try a different search term."
                  : "Add your first customer to get started."
              }
              actionLabel={query ? undefined : "Add Customer"}
              onAction={
                query
                  ? undefined
                  : () => navigation.navigate("CustomerAdd")
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              navigation.navigate("CustomerDetail", { customerId: item.id })
            }
            className="active:opacity-90"
          >
            <Card className="mb-2">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <UserRound size={18} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text weight="semibold">{item.fullName}</Text>
                  <Text variant="small" tone="muted" className="mt-0.5">
                    {item.contactNumber}
                  </Text>
                </View>
                <Badge
                  label={item.status}
                  tone={item.status === "active" ? "success" : "muted"}
                />
              </View>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
