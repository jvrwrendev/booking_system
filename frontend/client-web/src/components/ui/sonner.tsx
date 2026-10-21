import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Themed toast surface.
 *
 * `sonner` ships its own elevated default styling (a heavy drop shadow and
 * saturated backgrounds). This wrapper restyles it to match the flat Agrivet
 * design language: hairline borders, token colours, no shadow.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors={false}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group flex w-full items-start gap-3 rounded-md border border-border bg-card p-4 text-card-foreground",
          title: "text-sm font-medium text-foreground",
          description: "text-sm text-muted-foreground",
          actionButton:
            "inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          cancelButton:
            "inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          closeButton:
            "rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-destructive",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-info",
          loading: "[&_[data-icon]]:text-muted-foreground",
        },
      }}
    />
  );
}

export { toast };
