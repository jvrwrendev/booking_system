import React, { useCallback } from "react";
import { FlatList, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react-native";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useOrderCart } from "@/features/branch/orders/hooks/use-order-cart";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/shared/product-image";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleHeader } from "@/components/shared/module-header";
import type {
  BranchStackParamList,
  BranchTabParamList,
} from "@/app/navigation/types";

type FavoritesNavigation = CompositeNavigationProp<
  NativeStackNavigationProp<BranchStackParamList>,
  BottomTabNavigationProp<BranchTabParamList>
>;

export function FavoritesScreen() {
  const navigation = useNavigation<FavoritesNavigation>();
  const cart = useOrderCart();

  const onIncrease = useCallback(
    (item: { quantity: number; productId: string }) => {
      cart.setQuantity(item.productId, item.quantity + 1);
    },
    [cart],
  );

  const onDecrease = useCallback(
    (item: { quantity: number; productId: string }) => {
      const next = item.quantity - 1;
      if (next <= 0) cart.removeItem(item.productId);
      else cart.setQuantity(item.productId, next);
    },
    [cart],
  );

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={cart.hydrated ? cart.items : []}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: cart.items.length > 0 ? 108 : 24,
          gap: 12,
        }}
        ListHeaderComponent={
          <ModuleHeader
            eyebrow="Order"
            title="My Cart"
            subtitle="Products you added to cart. Review before submitting your order."
            action={
              cart.items.length > 0 ? (
                <View className="rounded-full border border-primary/20 bg-background px-2.5 py-1">
                  <Text variant="small" weight="semibold" tone="primary">
                    {cart.totalQuantity} item
                    {cart.totalQuantity === 1 ? "" : "s"}
                  </Text>
                </View>
              ) : undefined
            }
            className="mb-4"
          />
        }
        ListEmptyComponent={
          cart.hydrated ? (
            <EmptyState
              icon={<ShoppingCart size={24} color="#64748B" />}
              title="Your cart is empty"
              description="Tap “Add to cart” on any product and it will show up here."
              actionLabel="Browse products"
              onAction={() => navigation.navigate("Catalog")}
            />
          ) : (
            <View />
          )
        }
        renderItem={({ item }) => (
          <Card padded={false} className="overflow-hidden">
            <View className="flex-row items-center gap-3 p-3">
              <ProductImage
                className="h-16 w-16 shrink-0 rounded-lg border border-border"
                iconSize={22}
              />
              <View className="flex-1">
                <Text weight="semibold" numberOfLines={2} className="text-sm leading-5">
                  {item.productName}
                </Text>
                <Text variant="small" tone="muted" numberOfLines={1} className="mt-0.5">
                  {item.sku} · ₱{item.unitPrice.toLocaleString()} each
                </Text>
                <Text weight="bold" tone="primary" className="mt-1 text-sm">
                  ₱{item.subtotal.toLocaleString()}
                </Text>
              </View>
              <View className="items-center gap-2">
                <View className="flex-row items-center gap-2 rounded-full border border-border px-1 py-1">
                  <Pressable
                    onPress={() => onDecrease(item)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${item.productName} quantity`}
                    className="h-7 w-7 items-center justify-center rounded-full bg-muted active:scale-90"
                  >
                    <Minus size={14} color="#0F172A" />
                  </Pressable>
                  <Text weight="semibold" className="w-6 text-center text-sm">
                    {item.quantity}
                  </Text>
                  <Pressable
                    onPress={() => onIncrease(item)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${item.productName} quantity`}
                    className="h-7 w-7 items-center justify-center rounded-full bg-primary active:scale-90"
                  >
                    <Plus size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => cart.removeItem(item.productId)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${item.productName} from cart`}
                  className="flex-row items-center gap-1 active:opacity-70"
                >
                  <Trash2 size={13} color="#DC2626" />
                  <Text variant="small" className="text-[#DC2626]">
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          </Card>
        )}
      />

      {cart.items.length > 0 ? (
        <View
          className="absolute bottom-4 left-4 right-4 overflow-hidden rounded-xl border border-border bg-background px-4 py-3"
          style={{
            shadowColor: "#0F172A",
            shadowOpacity: 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          }}
        >
          <View className="mb-2 flex-row items-center justify-between">
            <Text variant="small" tone="muted">
              {cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}
            </Text>
            <Text weight="bold" className="text-base">
              ₱{cart.subtotal.toLocaleString()}
            </Text>
          </View>
          <Button
            label="Review order"
            size="md"
            fullWidth
            leftIcon={<ShoppingCart size={16} color="#FFFFFF" />}
            onPress={() =>
              navigation.navigate("OrderCreate", { initialStep: "cart" })
            }
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}
