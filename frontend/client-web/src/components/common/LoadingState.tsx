import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateVariant = "table" | "cards" | "form" | "detail";

interface LoadingStateProps {
  /** Number of skeleton rows for the `table` and `cards` variants. */
  rows?: number;
  showHeader?: boolean;
  variant?: LoadingStateVariant;
  className?: string;
}

/**
 * Skeleton placeholder shown while a page or panel loads.
 */
export function LoadingState({
  rows = 5,
  showHeader = true,
  variant = "table",
  className,
}: LoadingStateProps) {
  if (variant === "cards") {
    return (
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          className
        )}
        aria-busy="true"
        aria-live="polite"
      >
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-6", className)} aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-6", className)} aria-busy="true">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="rounded-lg border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {showHeader && (
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      )}
      <div className="rounded-lg border bg-card">
        <div className="border-b bg-muted/30">
          <Skeleton className="m-3 h-4 w-1/2" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b px-3 py-3 last:border-0"
          >
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
