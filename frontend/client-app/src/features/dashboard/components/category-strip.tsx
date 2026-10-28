import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Check, LayoutGrid, Shapes } from "lucide-react-native";
import { cn, pluralize } from "@/lib/utils";
import type { Category } from "@/types/category";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProductImage } from "@/components/shared/product-image";

interface CategoryStripProps {
  categories: Category[];
  images: Record<string, string | undefined>;
  selectedCategoryId: string | null;
  totalProducts: number;
  onSelect: (categoryId: string | null) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const TILE_WIDTH = 116;

function TileSkeleton() {
  return (
    <View style={{ width: TILE_WIDTH }}>
      <Card padded={false} className="overflow-hidden">
        <Skeleton className="h-[76px] w-full rounded-none" />
        <View className="px-2.5 py-2">
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mt-1.5 h-2.5 w-1/2" />
        </View>
      </Card>
    </View>
  );
}

export function CategoryStrip({
  categories,
  images,
  selectedCategoryId,
  totalProducts,
  onSelect,
  loading,
  error,
  onRetry,
}: CategoryStripProps) {
  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 4 }}
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <TileSkeleton key={index} />
        ))}
      </ScrollView>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<Shapes size={24} color="#64748B" />}
        title="No categories available"
        description="Categories will appear here once the catalog has been organised."
      />
    );
  }

  const allSelected = selectedCategoryId === null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingRight: 4 }}
    >
      <Pressable
        onPress={() => onSelect(null)}
        accessibilityRole="button"
        accessibilityState={{ selected: allSelected }}
        accessibilityLabel="Show all products"
        className="active:opacity-80"
        style={{ width: TILE_WIDTH }}
      >
        <Card
          padded={false}
          className={cn("overflow-hidden", allSelected && "border-primary")}
        >
          <View className="h-[76px] w-full items-center justify-center border-b border-border bg-secondary">
            <LayoutGrid size={22} color={allSelected ? "#16A34A" : "#64748B"} />
          </View>
          <View className="px-2.5 py-2">
            <Text
              variant="small"
              weight="semibold"
              numberOfLines={1}
              tone={allSelected ? "primary" : "default"}
            >
              All products
            </Text>
            <Text variant="small" tone="muted" className="mt-0.5 text-[10px]">
              {pluralize(totalProducts, "product")}
            </Text>
          </View>
        </Card>
      </Pressable>

      {categories.map((category) => {
        const selected = selectedCategoryId === category.id;
        const image = images[category.id];

        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(selected ? null : category.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`Filter products by ${category.name}`}
            className="active:opacity-80"
            style={{ width: TILE_WIDTH }}
          >
            <Card
              padded={false}
              className={cn("overflow-hidden", selected && "border-primary")}
            >
              <View className="relative">
                <ProductImage
                  source={image}
                  accessibilityLabel={`${category.name} category image`}
                  fallbackIcon={<Shapes size={22} color="#64748B" />}
                  className="h-[76px] w-full border-b border-border"
                />
                {selected ? (
                  <View className="absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check size={12} color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
              <View className="px-2.5 py-2">
                <Text
                  variant="small"
                  weight="semibold"
                  numberOfLines={1}
                  tone={selected ? "primary" : "default"}
                >
                  {category.name}
                </Text>
                <Text
                  variant="small"
                  tone="muted"
                  numberOfLines={1}
                  className="mt-0.5 text-[10px]"
                >
                  {pluralize(category.productCount, "product")}
                </Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
