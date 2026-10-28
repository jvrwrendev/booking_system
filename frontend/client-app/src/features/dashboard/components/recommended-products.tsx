import React from "react";
import { Pressable, View } from "react-native";
import { ChevronRight, Package } from "lucide-react-native";
import { formatCurrency } from "@/lib/utils";
import { getProductStockStatus, type Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProductImage } from "@/components/shared/product-image";

interface RecommendedProductsProps {
  products: Product[];
  columns: number;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onPressProduct: (product: Product) => void;
  onBrowseCatalog: () => void;
  selectedCategoryName: string | null;
  onClearFilter: () => void;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function CardSkeleton() {
  return (
    <Card padded={false} className="flex-1 overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <View className="p-3">
        <Skeleton className="h-2.5 w-1/2" />
        <Skeleton className="mt-2 h-3.5 w-full" />
        <Skeleton className="mt-1.5 h-3.5 w-3/4" />
        <Skeleton className="mt-3 h-3 w-1/3" />
      </View>
    </Card>
  );
}

function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const stockStatus = getProductStockStatus(product);
  const outOfStock = stockStatus === "out_of_stock";
  const stockLabel = outOfStock
    ? "Out of stock"
    : `${product.stockQuantity} left`;
  const stockTone = outOfStock
    ? "danger"
    : stockStatus === "in_stock"
      ? "success"
      : "warning";

  return (
    <Card padded={false} className="flex-1 overflow-hidden">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${product.name}, ${stockLabel}`}
        className="active:opacity-80"
      >
        <View>
          <ProductImage
            source={product.image}
            accessibilityLabel={`${product.name} image`}
            className="h-32 w-full border-b border-border"
            iconSize={28}
          />
          {outOfStock ? (
            <View className="absolute inset-0 items-center justify-center bg-background/60">
              <View className="rounded-full bg-foreground/90 px-3 py-1">
                <Text variant="small" weight="semibold" className="text-white">
                  Out of stock
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="p-3">
          <Text
            variant="small"
            tone="muted"
            numberOfLines={1}
            className="text-[11px] uppercase tracking-wide"
          >
            {product.categoryName}
          </Text>
          <Text
            weight="semibold"
            numberOfLines={2}
            className="mt-1 min-h-[40px] text-sm leading-5"
          >
            {product.name}
          </Text>
          <Text weight="bold" tone="primary" className="mt-1.5 text-sm">
            {formatCurrency(product.sellingPrice)}
            <Text variant="small" tone="muted" weight="regular">
              {" "}
              / {product.unit}
            </Text>
          </Text>
          <View className="mt-2">
            <Badge label={stockLabel} tone={stockTone} />
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

export function RecommendedProducts({
  products,
  columns,
  loading,
  error,
  onRetry,
  onPressProduct,
  onBrowseCatalog,
  selectedCategoryName,
  onClearFilter,
}: RecommendedProductsProps) {
  const subtitle = selectedCategoryName
    ? `Top picks in ${selectedCategoryName}`
    : "Popular with your branch and recently stocked";

  return (
    <View>
      <SectionHeader
        title="Recommended Products for You"
        subtitle={subtitle}
        action={
          <Button
            variant="outline"
            size="sm"
            label="Browse catalog"
            rightIcon={<ChevronRight size={14} color="#64748B" />}
            onPress={onBrowseCatalog}
          />
        }
      />

      {loading ? (
        <View className="gap-3">
          {Array.from({ length: 2 }).map((_, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-3">
              {Array.from({ length: columns }).map((__, cardIndex) => (
                <CardSkeleton key={cardIndex} />
              ))}
            </View>
          ))}
        </View>
      ) : error ? (
        <ErrorState description={error} onRetry={onRetry} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package size={24} color="#64748B" />}
          title={
            selectedCategoryName
              ? `No products in ${selectedCategoryName}`
              : "No products available"
          }
          description={
            selectedCategoryName
              ? "Try another category or browse the full catalog."
              : "Products will appear here once they are added to the catalog."
          }
          actionLabel={selectedCategoryName ? "Show all products" : undefined}
          onAction={selectedCategoryName ? onClearFilter : undefined}
        />
      ) : (
        <View className="gap-3">
          {chunk(products, columns).map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-3">
              {row.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => onPressProduct(product)}
                />
              ))}
              {Array.from({ length: columns - row.length }).map(
                (_, spacerIndex) => (
                  <View key={`spacer-${spacerIndex}`} className="flex-1" />
                ),
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
