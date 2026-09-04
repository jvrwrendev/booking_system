import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  rows?: number;
  showHeader?: boolean;
}

export function LoadingState({ rows = 5, showHeader = true }: LoadingStateProps) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex gap-3">
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
          <div key={i} className="flex items-center gap-3 border-b px-3 py-3 last:border-0">
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