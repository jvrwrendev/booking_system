import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StepperStep {
  id: string;
  title: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Zero-based index of the step in progress. */
  current: number;
  className?: string;
  /** Accessible name for the surrounding navigation landmark. */
  label?: string;
}

/**
 * Flat progress indicator for a multi-step form.
 *
 * Depth is expressed with borders and fills only — no shadows or gradients.
 * Below `sm` the trail is replaced by a compact caption plus a progress bar,
 * because four labelled steps do not fit on a phone.
 */
export function Stepper({
  steps,
  current,
  className,
  label = "Progress",
}: StepperProps) {
  const lastIndex = steps.length - 1;
  const active = steps[current];
  const percent =
    steps.length <= 1 ? 0 : Math.round((current / lastIndex) * 100);

  return (
    <nav aria-label={label} className={className}>
      {/* Compact caption for narrow viewports. */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            {active?.title ?? ""}
          </p>
          <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
            Step {current + 1} of {steps.length}
          </p>
        </div>
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={current + 1}
          aria-valuetext={`Step ${current + 1} of ${steps.length}: ${active?.title ?? ""}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${Math.max(percent, 6)}%` }}
          />
        </div>
      </div>

      {/* Inline trail on wider viewports. */}
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const isLast = index === lastIndex;

          return (
            <li
              key={step.id}
              className="flex min-w-0 items-center gap-2"
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                  isDone && "bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-2 border-primary bg-background text-primary",
                  !isDone &&
                    !isCurrent &&
                    "border border-border bg-background text-muted-foreground"
                )}
                aria-hidden
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>

              <span
                className={cn(
                  "truncate whitespace-nowrap text-xs",
                  isCurrent
                    ? "font-medium text-foreground"
                    : isDone
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {step.title}
                {isDone && <span className="sr-only"> (completed)</span>}
                {isCurrent && <span className="sr-only"> (current step)</span>}
              </span>

              {!isLast && (
                <span
                  className={cn(
                    "mx-1 h-px w-6 shrink-0",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
