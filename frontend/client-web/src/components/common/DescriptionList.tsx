import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  hint?: string;
}

interface DescriptionListProps {
  items: DescriptionItem[];
  /** Number of columns on wide screens. Defaults to two. */
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Label/value grid used by every detail page.
 *
 * Replaces the six hand-rolled `InfoRow`/`SummaryLine` helpers that had
 * drifted apart, so a detail page always renders metadata the same way.
 */
export function DescriptionList({
  items,
  columns = 2,
  className,
}: DescriptionListProps) {
  const cols =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2";

  return (
    <dl className={cn("grid gap-x-6 gap-y-4", cols, className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 space-y-0.5">
          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="break-words text-sm font-medium text-foreground">
            {item.value ?? "—"}
          </dd>
          {item.hint && (
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          )}
        </div>
      ))}
    </dl>
  );
}

interface DetailRowProps {
  label: string;
  value: ReactNode;
  /** Emphasise the row — used for the grand total. */
  emphasis?: boolean;
  className?: string;
}

/**
 * Compact label/value row used for totals and summaries.
 */
export function DetailRow({
  label,
  value,
  emphasis,
  className,
}: DetailRowProps) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 text-sm",
        className
      )}
    >
      <span className={emphasis ? "font-medium text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          emphasis ? "font-semibold text-foreground" : "font-medium text-foreground"
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
