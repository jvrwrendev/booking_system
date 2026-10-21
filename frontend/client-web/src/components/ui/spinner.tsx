import * as React from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  label?: string;
}

/**
 * Single loading indicator used across the app so every async surface has
 * the same, accessible busy affordance.
 */
export function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin text-muted-foreground", className)}
      {...props}
    />
  );
}
