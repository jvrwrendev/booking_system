import React from "react";
import { Pressable } from "react-native";
import { Heart } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteButtonProps {
  productId: string;
  size?: number;
  className?: string;
}

export function FavoriteButton({
  productId,
  size = 16,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);

  return (
    <Pressable
      onPress={() => toggleFavorite(productId)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        active ? "Remove from favorites" : "Add to favorites"
      }
      accessibilityState={{ selected: active }}
      style={{
        shadowColor: "#0F172A",
        shadowOpacity: 0.12,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
      className={cn(
        "h-8 w-8 items-center justify-center rounded-full border active:scale-90",
        active
          ? "border-danger/15 bg-danger/10"
          : "border-border/70 bg-background/90",
        className,
      )}
    >
      <Heart
        size={size}
        color={active ? "#DC2626" : "#94A3B8"}
        fill={active ? "#DC2626" : "none"}
        strokeWidth={2}
      />
    </Pressable>
  );
}
