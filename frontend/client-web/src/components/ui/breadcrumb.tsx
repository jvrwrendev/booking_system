import * as React from "react";
import { Link } from "react-router-dom";
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
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => {
          const last = idx === items.length - 1;
          const content = last ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : item.href ? (
            <Link
              to={item.href}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          );

          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 opacity-50"
                  aria-hidden
                />
              )}
              {content}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
