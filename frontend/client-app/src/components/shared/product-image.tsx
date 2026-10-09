import React, { useState } from "react";
import { Image, View } from "react-native";
import { Package } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  source?: string;
  className?: string;
  iconSize?: number;
}

export function ProductImage({
  source,
  className,
  iconSize = 22,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(source) && !failed;

  if (showImage) {
    return (
      <Image
        source={{ uri: source }}
        resizeMode="cover"
        onError={() => setFailed(true)}
        accessibilityLabel="Product image"
        className={cn("bg-secondary", className)}
      />
    );
  }

  return (
    <View
      accessibilityLabel="Product image unavailable"
      className={cn("items-center justify-center bg-secondary", className)}
    >
      <Package size={iconSize} color="#64748B" />
    </View>
  );
}
