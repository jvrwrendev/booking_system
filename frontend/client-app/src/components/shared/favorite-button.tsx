import React from "react";
import { Pressable } from "react-native";
import { Heart } from "lucide-react-native";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteButtonProps {
  productId: string;
  size?: number;
  className?: string;
}

export function FavoriteButton({
  productId,
  size = 15,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(productId);

  return (
    <Pressable
      onPress={() => toggleFavorite(productId)}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={
        active ? "Remove from favorites" : "Add to favorites"
      }
      accessibilityState={{ selected: active }}
      className={`h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 active:opacity-70 ${
        className ?? ""
      }`}
    >
      <Heart
        size={size}
        color={active ? "#DC2626" : "#64748B"}
        fill={active ? "#DC2626" : "none"}
      />
    </Pressable>
  );
}
