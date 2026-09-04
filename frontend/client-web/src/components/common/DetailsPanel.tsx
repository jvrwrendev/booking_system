import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DetailsPanelItem {
  label: string;
  value: ReactNode;
  hint?: string;
}

interface DetailsPanelProps {
  title: string;
  description?: string;
  items?: DetailsPanelItem[];
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function DetailsPanel({
  title,
  description,
  items,
  children,
  footer,
  className,
}: DetailsPanelProps) {
  return (
    <div className={cn("sticky top-6 space-y-4", className)}>
      <Card>
        <CardContent className="space-y-4 p-5">
          <header className="space-y-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </header>
          {items && items.length > 0 && (
            <dl className="space-y-3 border-t pt-4">
              {items.map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">
                    {item.value}
                  </dd>
                  {item.hint && (
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  )}
                </div>
              ))}
            </dl>
          )}
          {children && <div className="border-t pt-4">{children}</div>}
        </CardContent>
      </Card>
      {footer}
    </div>
  );
}