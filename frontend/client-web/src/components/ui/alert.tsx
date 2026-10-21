import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Flat inline banner. Used for form-level errors, warnings and confirmations
 * so every surface in the app reports problems the same way.
 */
const alertVariants = cva(
  "relative flex w-full gap-3 rounded-md border px-4 py-3 text-sm [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "border-border bg-muted/50 text-foreground",
        destructive: "border-destructive/30 bg-destructive/8 text-destructive",
        warning: "border-warning/30 bg-warning/8 text-warning",
        success: "border-success/30 bg-success/8 text-success",
        info: "border-info/30 bg-info/8 text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/** The glyph shown for each variant. */
const ALERT_ICON = {
  default: Info,
  destructive: AlertCircle,
  warning: TriangleAlert,
  success: CheckCircle2,
  info: Info,
} as const;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Replaces the default variant glyph. Pass `null` to hide it. */
  icon?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => {
    const Icon = ALERT_ICON[variant ?? "default"];
    const glyph = icon === null ? null : (icon ?? <Icon aria-hidden />);

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {glyph}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("mb-0.5 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription, alertVariants };
