import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { DescriptionList } from "./DescriptionList";
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

/**
 * Side panel used by detail and form pages to surface metadata and
 * contextual actions.
 */
export function DetailsPanel({
  title,
  description,
  items,
  children,
  footer,
  className,
}: DetailsPanelProps) {
  return (
    <div className={cn("space-y-4", className)}>
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
            <div className="border-t pt-4">
              <DescriptionList items={items} columns={1} />
            </div>
          )}
          {children && <div className="border-t pt-4">{children}</div>}
        </CardContent>
      </Card>
      {footer}
    </div>
  );
}
