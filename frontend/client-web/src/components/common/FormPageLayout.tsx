import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface FormPageLayoutProps {
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  backHref: string;
  backLabel?: string;
  meta?: { label: string; value: string }[];
  /** Page-level error banner (e.g. a failed submit). */
  error?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  fullscreen?: boolean;
  topActions?: ReactNode;
}

export function FormPageLayout({
  title,
  description,
  breadcrumbs,
  backHref,
  backLabel = "Back",
  meta,
  error,
  children,
  sidebar,
  fullscreen = false,
  topActions,
}: FormPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="-mx-4 -my-5 min-h-[calc(100vh-4rem)] bg-muted/30 md:-mx-6 md:-my-6">
      <div
        className={cn(
          "mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-10",
          fullscreen ? "max-w-none" : "max-w-6xl"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => navigate(backHref)}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {backLabel}
            </Button>
            <Breadcrumb items={breadcrumbs} />
          </div>
          {topActions && (
            <div className="flex items-center gap-2">{topActions}</div>
          )}
        </div>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
              {description}
            </p>
          )}
          {meta && meta.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 text-xs">
              {meta.map((m) => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-medium text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="mt-6">{error}</div>}

        <div
          className={cn(
            "mt-8 grid gap-10",
            sidebar ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""
          )}
        >
          <div className="min-w-0">{children}</div>
          {sidebar && <aside className="hidden lg:block">{sidebar}</aside>}
        </div>
      </div>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

interface FormFooterProps {
  onCancel?: () => void;
  submitLabel: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  hint?: string;
}

export function FormFooter({
  onCancel,
  submitLabel,
  cancelLabel = "Cancel",
  isSubmitting = false,
  hint,
}: FormFooterProps) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-10 flex flex-col-reverse items-stretch gap-3 border-t bg-background px-4 py-4 sm:-mx-6 sm:flex-row sm:items-center sm:px-6 lg:-mx-10 lg:px-10">
      <p className="text-xs text-muted-foreground">
        {hint ?? "Fields marked with * are required."}
      </p>
      <div className="flex items-center gap-2 sm:ml-auto">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  /** Field-level validation message. Takes precedence over `hint`. */
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  optional,
  hint,
  error,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden>
            *
          </span>
        )}
        {optional && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            Optional
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
