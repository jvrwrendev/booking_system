import React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

interface DividerProps extends ViewProps {
  className?: string;
  vertical?: boolean;
}

export function Divider({ className, vertical, ...rest }: DividerProps) {
  return (
    <View
      {...rest}
      className={cn(
        vertical ? "w-px h-full" : "h-px w-full",
        "bg-border",
        className,
      )}
    />
  );
}
