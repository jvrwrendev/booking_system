import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Heart, Plus, Search, ShoppingCart } from "lucide-react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { listProducts } from "@/services/product.service";
import { useFavorites } from "@/hooks/use-favorites";
import { useOrderCart } from "@/features/branch/orders/hooks/use-order-cart";
import type { Product } from "@/types/product";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { CategoryFilterButton } from "@/components/shared/category-filter";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import type { BranchStackParamList } from "@/app/navigation/types";

export function FavoritesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const { isFavorite } = useFavorites();
  const cart = useOrderCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listProducts();
      setProducts(list);
    } catch {
      setError("Failed to load favorites.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products.filter((p) => isFavorite(p.id)).map((p) => p.categoryName),
        ),
      )
        .filter(Boolean)
        .sort(),
    [products, isFavorite],
  );

  const favorites = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        isFavorite(p.id) &&
        (category === "all" || p.categoryName === category) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)),
    );
  }, [products, query, category, isFavorite]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={favorites}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: cart.items.length > 0 ? 88 : 24,
          gap: 12,
        }}
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
                  Saved
                </Text>
                <Text variant="h1" weight="bold">
                  My Favorites
                </Text>
              </View>
              <View className="mt-1 rounded-full bg-primary/10 px-2.5 py-1">
                <Text variant="small" weight="semibold" tone="primary">
                  {favorites.length} saved
                </Text>
              </View>
            </View>
            <Text variant="small" tone="muted" className="mt-1">
              Products you&#39;ve saved for quick reordering.
            </Text>

            <View className="mt-4 flex-row gap-2">
              <Input
                size="control"
                containerClassName="flex-1"
                value={query}
                onChangeText={setQuery}
                placeholder="Search favorites"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Search size={18} color="#64748B" />}
              />
              <CategoryFilterButton
                categories={categories}
                value={category}
                onChange={setCategory}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading favorites..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => void load()} />
          ) : (
            <EmptyState
              icon={<Heart size={24} color="#64748B" />}
              title="No favorites yet"
              description={
                query
                  ? "Try a different search term."
                  : "Tap the heart on any product to save it here."
              }
              actionLabel={query ? undefined : "Browse products"}
              onAction={
                query
                  ? undefined
                  : () => navigation.navigate("OrderCreate")
              }
            />
          )
        }
        renderItem={({ item }) => {
          const outOfStock = item.stockQuantity <= 0;
          const inCart =
            cart.items.find((i) => i.productId === item.id)?.quantity ?? 0;
          const atMax = !outOfStock && inCart >= item.stockQuantity;
          return (
            <Card padded={false} className="flex-1 overflow-hidden">
              <Pressable
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item.id })
                }
                accessibilityRole="button"
                accessibilityLabel={`View ${item.name}`}
                className="active:opacity-80"
              >
                <View>
                  <ProductImage
                    source={item.image}
                    className="h-32 w-full border-b border-border"
                    iconSize={28}
                  />
                  <View className="absolute left-2 top-2">
                    <FavoriteButton productId={item.id} />
                  </View>
                  {outOfStock ? (
                    <View className="absolute inset-0 items-center justify-center bg-background/60">
                      <View className="rounded-full bg-foreground/90 px-3 py-1">
                        <Text
                          variant="small"
                          weight="semibold"
                          className="text-white"
                        >
                          Out of stock
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                <View className="p-3">
                  <Text
                    weight="semibold"
                    numberOfLines={2}
                    className="text-sm leading-5"
                  >
                    {item.name}
                  </Text>
                  <Text
                    variant="small"
                    tone="muted"
                    numberOfLines={1}
                    className="mt-0.5"
                  >
                    {item.sku} · {item.categoryName}
                  </Text>

                  <View className="mt-2.5 flex-row items-center justify-between gap-2">
                    <Text weight="bold" tone="primary" className="text-sm">
                      ₱{item.sellingPrice.toLocaleString()}
                      <Text variant="small" tone="muted" weight="regular">
                        {" "}
                        / {item.unit}
                      </Text>
                    </Text>
                    <Badge
                      label={outOfStock ? "0 left" : `${item.stockQuantity} left`}
                      tone={outOfStock ? "danger" : item.stockQuantity <= 5 ? "warning" : "success"}
                    />
                  </View>

                  <View className="mt-3 flex-row items-center justify-between">
                    {inCart > 0 ? (
                      <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2 py-1">
                        <Check size={12} color="#16A34A" />
                        <Text
                          variant="small"
                          weight="semibold"
                          tone="primary"
                        >
                          ×{inCart} in cart
                        </Text>
                      </View>
                    ) : (
                      <Text variant="small" tone="muted">
                        Tap + to add
                      </Text>
                    )}
                    <Pressable
                      onPress={() => cart.addItem(item, 1)}
                      disabled={outOfStock || atMax}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                      className={`h-8 w-8 items-center justify-center rounded-full active:scale-90 ${
                        outOfStock || atMax
                          ? "bg-muted"
                          : "bg-primary"
                      }`}
                    >
                      <Plus
                        size={16}
                        color={outOfStock || atMax ? "#94A3B8" : "#FFFFFF"}
                      />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Card>
          );
        }}
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
          <Button
            label={`View cart (${cart.totalQuantity} item${
              cart.totalQuantity === 1 ? "" : "s"
            }) · ₱${cart.subtotal.toLocaleString()}`}
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
