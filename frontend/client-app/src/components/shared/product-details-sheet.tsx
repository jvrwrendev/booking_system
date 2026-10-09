import React, { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { ShoppingCart, X } from "lucide-react-native";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { ProductImage } from "@/components/shared/product-image";
import type { Product } from "@/types/product";

interface ProductDetailsSheetProps {
  product: Product | null;
  inCart: number;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-2">
      <Text variant="small" tone="muted">
        {label}
      </Text>
      <Text variant="small" weight="medium" className="flex-1 text-right">
        {value}
      </Text>
    </View>
  );
}

function SheetContent({
  product,
  inCart,
  onClose,
  onAdd,
}: {
  product: Product;
  inCart: number;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const outOfStock = product.stockQuantity <= 0;
  const remaining = Math.max(product.stockQuantity - inCart, 0);

  const addHint = outOfStock
    ? "This product is out of stock."
    : remaining === 0
      ? "All available stock is already in your cart."
      : null;

  return (
    <ScrollView
      bounces={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
      }}
    >
      <View>
        <ProductImage
          source={product.image}
          className="h-48 w-full rounded-xl border border-border"
          iconSize={40}
        />
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close product details"
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 active:bg-accent/10"
        >
          <X size={16} color="#0F172A" />
        </Pressable>
      </View>

      <Text variant="h3" weight="semibold" className="mt-4">
        {product.name}
      </Text>
      <Text variant="small" tone="muted" className="mt-1">
        {product.sku} • {product.categoryName}
      </Text>

      <View className="mt-3 flex-row items-end gap-1.5">
        <Text variant="h2" weight="bold" tone="primary">
          ₱{product.sellingPrice.toLocaleString()}
        </Text>
        <Text variant="small" tone="muted" className="mb-1">
          / {product.unit}
        </Text>
      </View>

      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Badge
          label={
            outOfStock ? "Out of stock" : `${product.stockQuantity} in stock`
          }
          tone={outOfStock ? "danger" : "success"}
        />
        {inCart > 0 ? (
          <Badge label={`${inCart} in cart`} tone="primary" variant="solid" />
        ) : null}
        <Badge label={product.brand} tone="muted" />
      </View>

      <Text variant="body" tone="muted" className="mt-4 leading-6">
        {product.description}
      </Text>

      <View className="mt-4 rounded-xl border border-border bg-background px-4 py-1">
        <SpecRow label="Category" value={product.categoryName} />
        <SpecRow label="Brand" value={product.brand} />
        <SpecRow label="Supplier" value={product.supplier} />
        <SpecRow label="Unit" value={product.unit} />
        <SpecRow label="Minimum stock" value={`${product.minimumStockLevel}`} />
      </View>

      <View className="mt-5 h-px bg-border" />

      <View className="mt-4">
        <Text variant="label" tone="muted" className="mb-2">
          ADD TO CART
        </Text>
        {addHint ? (
          <Text variant="small" tone={outOfStock ? "danger" : "muted"}>
            {addHint}
          </Text>
        ) : null}
        <QuantitySelector
          value={qty}
          onChange={setQty}
          max={remaining}
          disabled={remaining === 0}
          className="mt-2 w-full"
        />
        <Button
          label={qty > 1 ? `Add ${qty} to cart` : "Add to cart"}
          size="control"
          fullWidth
          leftIcon={<ShoppingCart size={18} color="#FFFFFF" />}
          disabled={qty === 0 || remaining === 0}
          className="mt-3"
          onPress={() => onAdd(product, qty)}
        />
      </View>
    </ScrollView>
  );
}

export function ProductDetailsSheet({
  product,
  inCart,
  onClose,
  onAdd,
}: ProductDetailsSheetProps) {
  return (
    <Modal
      transparent
      visible={product !== null}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
        <Pressable
          onPress={() => {}}
          className="w-full self-center rounded-t-2xl border-t border-border bg-background"
        >
          {product ? (
            <SheetContent
              key={product.id}
              product={product}
              inCart={inCart}
              onClose={onClose}
              onAdd={onAdd}
            />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
