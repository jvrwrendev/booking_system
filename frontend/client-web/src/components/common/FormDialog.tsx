import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** Icon tile rendered to the left of the title. */
  icon?: ReactNode;
  /** `id` of the `<form>` inside — the footer submit button targets it. */
  formId: string;
  submitLabel: string;
  submitting?: boolean;
  cancelLabel?: string;
  /** Disables the submit button for reasons other than `submitting`. */
  submitDisabled?: boolean;
  /** Small helper line shown at the start of the footer. */
  hint?: ReactNode;
  /** Prevent closing while a request is in flight. */
  busy?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * The single shell for "a form inside a modal".
 *
 * Keeps every create/edit dialog in the app on the same header rhythm,
 * scroll behaviour and footer, so the form surface never drifts between
 * modules.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  formId,
  submitLabel,
  submitting = false,
  cancelLabel = "Cancel",
  submitDisabled = false,
  hint,
  busy = false,
  className,
  children,
}: FormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy || submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn(
          "flex max-h-[92dvh] w-full flex-col gap-0 p-0 sm:max-w-2xl",
          className
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12">
          <DialogTitle className="flex items-center gap-2.5">
            {icon && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {icon}
              </span>
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
          {children}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {hint ?? "Fields marked with * are required."}
          </p>
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              form={formId}
              className="min-w-[140px]"
              disabled={submitting || submitDisabled}
              aria-busy={submitting}
            >
              {submitting ? "Saving…" : submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
