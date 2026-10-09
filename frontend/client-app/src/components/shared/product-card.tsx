import React from "react";
import { Pressable, View } from "react-native";
import { Info, Minus, Plus } from "lucide-react-native";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton } from "@/components/shared/favorite-button";

interface ProductCardProps {
  product: Product;
  inCart: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onInfo: () => void;
}

export function ProductCard({
  product,
  inCart,
  onIncrement,
  onDecrement,
  onInfo,
}: ProductCardProps) {
  const outOfStock = product.stockQuantity <= 0;
  const atMax = !outOfStock && inCart >= product.stockQuantity;
  const canAdd = !outOfStock && !atMax;

  return (
    <Card padded={false} className="flex-1 justify-between overflow-hidden">
      <Pressable
        onPress={() => {
          if (!canAdd) return;
          onIncrement();
        }}
        disabled={outOfStock}
        accessibilityRole="button"
        accessibilityLabel={
          outOfStock
            ? `${product.name} is out of stock`
            : `Add ${product.name} to cart`
        }
        className={cn("active:opacity-80", outOfStock && "opacity-60")}
      >
        <View>
          <ProductImage
            source={product.image}
            className="h-28 w-full border-b border-border"
            iconSize={26}
          />
          <View className="absolute left-2 top-2">
            <FavoriteButton productId={product.id} />
          </View>
          <Pressable
            onPress={onInfo}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`View details for ${product.name}`}
            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 active:bg-accent/10"
          >
            <Info size={13} color="#64748B" />
          </Pressable>
        </View>
        <View className="p-2.5">
          <Text
            weight="semibold"
            numberOfLines={2}
            className="text-sm leading-5"
          >
            {product.name}
          </Text>
          <Text variant="small" tone="muted" numberOfLines={1} className="mt-0.5">
            {product.categoryName}
          </Text>
          <Text weight="semibold" tone="primary" className="mt-1.5 text-sm">
            ₱{product.sellingPrice.toLocaleString()}
            <Text variant="small" tone="muted">
              {" "}
              / {product.unit}
            </Text>
          </Text>
          <View className="mt-2">
            <Badge
              label={
                outOfStock ? "Out of stock" : `${product.stockQuantity} in stock`
              }
              tone={outOfStock ? "danger" : "success"}
            />
          </View>
        </View>
      </Pressable>
      <View className="px-2.5 pb-2.5">
        <View
          className={cn(
            "flex-row items-center overflow-hidden rounded-lg border",
            inCart > 0
              ? "border-primary bg-primary/5"
              : "border-border bg-background",
          )}
        >
          <Pressable
            onPress={onDecrement}
            disabled={inCart === 0}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Remove one ${product.name} from cart`}
            className={cn(
              "h-9 w-9 items-center justify-center active:bg-secondary",
              inCart === 0 && "opacity-40",
            )}
          >
            <Minus size={14} color={inCart === 0 ? "#CBD5E1" : "#0F172A"} />
          </Pressable>
          <View className="flex-1 items-center justify-center">
            <Text
              variant="small"
              weight="semibold"
              tone={inCart > 0 ? "primary" : "muted"}
            >
              {inCart}
            </Text>
          </View>
          <Pressable
            onPress={onIncrement}
            disabled={!canAdd}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Add one ${product.name} to cart`}
            className={cn(
              "h-9 w-9 items-center justify-center active:bg-secondary",
              !canAdd && "opacity-40",
            )}
          >
            <Plus size={14} color={canAdd ? "#0F172A" : "#CBD5E1"} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}
