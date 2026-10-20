import React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
  className?: string;
  padded?: boolean;
}

export function Card({ className, padded = true, children, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      className={cn(
        "rounded-lg border border-border bg-card",
        padded && "p-4",
        className,
      )}
    >
      {children}
    </View>
  );
}
