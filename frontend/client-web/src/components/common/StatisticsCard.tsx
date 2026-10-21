import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatisticsCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction?: "up" | "down";
  };
  /** Small marker rendered next to the label — e.g. a "Sample data" chip. */
  badge?: ReactNode;
  hint?: string;
  className?: string;
}

export function StatisticsCard({
  label,
  value,
  icon,
  trend,
  badge,
  hint,
  className,
}: StatisticsCardProps) {
  const trendPositive = trend?.direction === "up";
  return (
    <Card className={cn("bg-card", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              {badge}
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {value}
            </div>
            {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        {trend && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1 text-xs",
              trendPositive ? "text-success" : "text-destructive"
            )}
          >
            {trendPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
            )}
            <span className="font-medium tabular-nums">
              {trend.value > 0 ? "+" : ""}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
