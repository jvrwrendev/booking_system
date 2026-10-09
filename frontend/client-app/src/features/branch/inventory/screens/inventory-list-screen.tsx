import React, { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, ShoppingCart } from "lucide-react-native";
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
import { ChipGroup } from "@/components/ui/select";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import type { BranchStackParamList } from "@/app/navigation/types";

type ProductFilter = "all" | "favorites";

export function InventoryListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const { isFavorite } = useFavorites();
  const cart = useOrderCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await listProducts();
      setProducts(list);
    } catch {
      setError("Failed to load inventory.");
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || isFavorite(p.id);
      return matchesQuery && matchesFilter;
    });
  }, [products, query, filter, isFavorite]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        data={filtered}
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
            <Text variant="small" tone="muted">
              Browse
            </Text>
            <Text variant="h1" weight="bold">
              Inventory
            </Text>

            <View className="mt-4">
              <Input
                size="control"
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, SKU or category"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Search size={18} color="#64748B" />}
              />
            </View>

            <View className="mt-3">
              <ChipGroup<ProductFilter>
                options={[
                  { label: "All products", value: "all" },
                  { label: "Favorites", value: "favorites" },
                ]}
                value={filter}
                onChange={setFilter}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <LoadingState label="Loading inventory..." />
          ) : error ? (
            <ErrorState description={error} onRetry={() => void load()} />
          ) : (
            <EmptyState
              title={filter === "favorites" ? "No favorites yet" : "No products found"}
              description={
                filter === "favorites"
                  ? "Tap the heart on a product to save it here."
                  : query
                    ? "Try a different search term."
                    : "Products will appear here once available."
              }
            />
          )
        }
        renderItem={({ item }) => {
          const outOfStock = item.stockQuantity <= 0;
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
                    className="h-28 w-full border-b border-border"
                    iconSize={26}
                  />
                  <View className="absolute left-2 top-2">
                    <FavoriteButton productId={item.id} />
                  </View>
                </View>
                <View className="p-2.5">
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
                    {item.sku}
                  </Text>
                  <Text
                    weight="semibold"
                    tone="primary"
                    className="mt-1.5 text-sm"
                  >
                    ₱{item.sellingPrice.toLocaleString()}
                    <Text variant="small" tone="muted">
                      {" "}
                      / {item.unit}
                    </Text>
                  </Text>
                  <View className="mt-2">
                    <Badge
                      label={
                        outOfStock
                          ? "Out of stock"
                          : `${item.stockQuantity} in stock`
                      }
                      tone={outOfStock ? "danger" : "success"}
                    />
                  </View>
                </View>
              </Pressable>
            </Card>
          );
        }}
      />

      {cart.items.length > 0 ? (
        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-3">
          <Button
            label={`View cart (${cart.totalQuantity})`}
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
