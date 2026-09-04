import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<"nav"> {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items, className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      <ol className="flex items-center gap-1">
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              )}
              <span
                className={cn(
                  last ? "font-medium text-foreground" : "hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}