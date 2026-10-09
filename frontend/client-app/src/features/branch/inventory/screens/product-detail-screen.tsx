import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckCircle2 } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getProduct } from "@/services/product.service";
import { useOrderCart } from "@/features/branch/orders/hooks/use-order-cart";
import type { Product } from "@/types/product";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Divider } from "@/components/ui/divider";
import { ScreenHeader } from "@/components/shared/screen-header";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import type { BranchStackParamList } from "@/app/navigation/types";

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-1.5">
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="small" weight="medium" className="text-right">
        {value}
      </Text>
    </View>
  );
}

export function ProductDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const route = useRoute<RouteProp<BranchStackParamList, "ProductDetail">>();
  const cart = useOrderCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const p = await getProduct(route.params.productId);
      setProduct(p);
      if (!p) setError("Product not found.");
    } catch {
      setError("Failed to load product.");
    } finally {
      setLoading(false);
    }
  }, [route.params.productId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const inCart = product
    ? (cart.items.find((i) => i.productId === product.id)?.quantity ?? 0)
    : 0;
  const remaining = product ? Math.max(product.stockQuantity - inCart, 0) : 0;

  const onAdd = () => {
    if (!product || remaining <= 0) return;
    cart.addItem(product, qty);
    setAdded(true);
    setQty(1);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <ScreenHeader
          title="Product"
          subtitle="Inventory details"
          className="mb-4"
          action={
            product ? (
              <FavoriteButton productId={product.id} size={16} />
            ) : undefined
          }
        />

        {loading ? (
          <LoadingState label="Loading product..." />
        ) : error || !product ? (
          <ErrorState
            description={error ?? "Product not found."}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <ProductImage
              source={product.image}
              className="h-52 w-full rounded-xl border border-border"
              iconSize={40}
            />

            <View className="mt-4">
              <Text variant="h2" weight="bold">
                {product.name}
              </Text>
              <Text variant="small" tone="muted" className="mt-1">
                {product.sku} · {product.categoryName}
              </Text>
              <View className="mt-3 flex-row items-center gap-3">
                <Text variant="h3" weight="bold" tone="primary">
                  ₱{product.sellingPrice.toLocaleString()}
                </Text>
                <Text variant="small" tone="muted">
                  / {product.unit}
                </Text>
                <View className="flex-1 items-end">
                  <Badge
                    label={
                      remaining > 0
                        ? `${product.stockQuantity} in stock`
                        : inCart > 0
                          ? "All in cart"
                          : "Out of stock"
                    }
                    tone={remaining > 0 ? "success" : "danger"}
                  />
                </View>
              </View>
            </View>

            <Card className="mt-4">
              <Text variant="label" tone="muted">
                DESCRIPTION
              </Text>
              <Text variant="small" className="mt-1.5 leading-5">
                {product.description || "No description available."}
              </Text>
            </Card>

            <Card className="mt-3">
              <Text variant="label" tone="muted">
                DETAILS
              </Text>
              <View className="mt-1">
                <SpecRow label="Category" value={product.categoryName} />
                <Divider className="bg-border/60" />
                <SpecRow label="Brand" value={product.brand || "—"} />
                <Divider className="bg-border/60" />
                <SpecRow label="Supplier" value={product.supplier || "—"} />
                <Divider className="bg-border/60" />
                <SpecRow label="Unit" value={product.unit} />
                <Divider className="bg-border/60" />
                <SpecRow
                  label="Minimum stock"
                  value={String(product.minimumStockLevel)}
                />
              </View>
            </Card>

            <Card className="mt-3">
              <View className="flex-row items-center justify-between">
                <Text variant="label" tone="muted">
                  QUANTITY
                </Text>
                {inCart > 0 ? (
                  <Text variant="small" tone="primary" weight="medium">
                    {inCart} in cart
                  </Text>
                ) : null}
              </View>
              <View className="mt-2 flex-row items-center gap-3">
                <View className="w-40">
                  <QuantitySelector
                    value={qty}
                    onChange={setQty}
                    min={1}
                    max={Math.max(remaining, 1)}
                    disabled={remaining <= 0}
                  />
                </View>
                <Text variant="small" tone="muted" className="flex-1">
                  {remaining > 0
                    ? `Max ${remaining} available`
                    : "No stock available"}
                </Text>
              </View>

              <View className="mt-4 gap-2">
                <Button
                  label={added ? "Add more to cart" : `Add ${qty} to cart`}
                  size="control"
                  fullWidth
                  disabled={remaining <= 0}
                  leftIcon={
                    added ? (
                      <CheckCircle2 size={16} color="#FFFFFF" />
                    ) : undefined
                  }
                  onPress={onAdd}
                />
                {added && cart.items.length > 0 ? (
                  <Button
                    label={`View cart (${cart.totalQuantity})`}
                    variant="outline"
                    size="control"
                    fullWidth
                    onPress={() =>
                      navigation.navigate("OrderCreate", {
                        initialStep: "cart",
                      })
                    }
                  />
                ) : null}
              </View>

              {added && cart.items.length > 0 ? (
                <View className="mt-3 flex-row items-center justify-center gap-1.5">
                  <CheckCircle2 size={14} color="#16A34A" />
                  <Text variant="small" tone="primary" weight="medium">
                    Added to your order cart
                  </Text>
                </View>
              ) : null}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
