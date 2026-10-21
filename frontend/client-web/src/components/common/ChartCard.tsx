import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  /** Rendered on the right of the header — filters, legends, actions. */
  actions?: ReactNode;
  children: ReactNode;
  /** Fixed chart height. */
  height?: string;
  className?: string;
}

/**
 * Card wrapper for every chart in the app, so charts share the same header
 * rhythm, padding and flat surface.
 */
export function ChartCard({
  title,
  description,
  actions,
  children,
  height = "h-[260px]",
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </CardHeader>
      <CardContent className="flex-1">
        <div className={cn("w-full", height)}>{children}</div>
      </CardContent>
    </Card>
  );
}
