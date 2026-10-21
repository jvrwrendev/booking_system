import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Announced to screen readers as the field's purpose. */
  label?: string;
  /** Optional leading icon, e.g. a lock glyph. */
  leadingIcon?: ReactNode;
}

/**
 * Password field with a visibility toggle.
 *
 * Shared by every form that collects a password so the toggle behaviour and
 * its accessible state stay identical everywhere.
 */
export function PasswordInput({
  className,
  label = "password",
  leadingIcon,
  disabled,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {leadingIcon && (
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        >
          {leadingIcon}
        </span>
      )}
      <Input
        type={visible ? "text" : "password"}
        className={cn(
          leadingIcon ? "pl-9" : undefined,
          "pr-10",
          className
        )}
        disabled={disabled}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={visible}
        className="absolute right-0 top-0 flex h-9 w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
