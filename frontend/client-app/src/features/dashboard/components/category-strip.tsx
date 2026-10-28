import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Shapes } from "lucide-react-native";
import type { Category } from "@/types/category";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

interface CategoryStripProps {
  categories: Category[];
  onSelect: (categoryId: string | null) => void;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CategoryStrip({
  categories,
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
        contentContainerStyle={{ gap: 8, paddingRight: 4 }}
      >
        {[72, 104, 88, 112, 96].map((width, index) => (
          <View key={index} style={{ width }}>
            <Skeleton className="h-9 w-full rounded-full" />
          </View>
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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
    >
      <CategoryButton
        label="All"
        onPress={() => onSelect(null)}
        accessibilityLabel="Show all products"
      />

      {categories.map((category) => {
        return (
          <CategoryButton
            key={category.id}
            label={category.name}
            onPress={() => onSelect(category.id)}
            accessibilityLabel={`Filter products by ${category.name}`}
          />
        );
      })}
    </ScrollView>
  );
}

function CategoryButton({
  label,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="min-h-9 items-center justify-center rounded-full border border-border bg-card px-4 py-2 active:opacity-80"
    >
      <Text variant="small" weight="semibold">
        {label}
      </Text>
    </Pressable>
  );
}
