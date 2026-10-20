import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatisticsCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction?: "up" | "down";
  };
  hint?: string;
  className?: string;
}

export function StatisticsCard({
  label,
  value,
  icon,
  trend,
  hint,
  className,
}: StatisticsCardProps) {
  const trendPositive = trend?.direction === "up";
  return (
    <Card className={cn("border bg-card", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            {hint && (
              <div className="text-[11px] text-muted-foreground">{hint}</div>
              )}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        {trend && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1 text-xs",
              trendPositive ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {trendPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span className="font-medium">
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