import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormSection,
  FormField,
  FormFooter,
} from "@/components/common/FormPageLayout";

import type { AuthUser } from "@/types/auth";
import type { UserFormValues } from "../lib/user-mapper";

interface UserFormProps {
  initial?: AuthUser;
  submitLabel?: string;
  onSubmit: (data: UserFormValues) => void | Promise<void>;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
  /** Set while the parent is awaiting the API so inputs can be locked. */
  submitting?: boolean;
  /** Server-side error to surface above the fields. */
  submitError?: string | null;
}

/** Mirrors the API's `createUserDto` minimum, so the UI never under-promises. */
const MIN_PASSWORD_LENGTH = 8;

export function UserForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
  submitting = false,
  submitError = null,
}: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>(
    initial
      ? {
          name: initial.fullName,
          email: initial.email,
          role: initial.role,
          status: initial.status,
        }
      : { name: "", email: "", role: "ADMIN", status: "active", password: "" }
  );
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const localError = validate(values, confirmPassword, Boolean(initial));
    if (localError) {
      setError(localError);
      return;
    }

    setError(null);
    // Drop the password on edit; changing it is a separate, admin-only action.
    const payload = initial
      ? { name: values.name, email: values.email, role: values.role, status: values.status }
      : values;
    await onSubmit(payload);
  };

  const visibleError = error ?? submitError;

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-12">
      {visibleError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {visibleError}
        </div>
      )}

      <FormSection
        title="User details"
        description="The account's name, login credentials, and the role it can access."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              label="Full name"
              required
              htmlFor="name"
              hint="As it should appear on audit logs and orders."
            >
              <Input
                id="name"
                value={values.name}
                onChange={(e) =>
                  setValues((v) => ({ ...v, name: e.target.value }))
                }
                placeholder="e.g., Juan Dela Cruz"
                autoComplete="name"
                className="h-10"
              />
            </FormField>
          </div>
          <FormField
            label="Email"
            required
            htmlFor="email"
            hint="Used for signing in. Must be unique."
          >
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) =>
                setValues((v) => ({ ...v, email: e.target.value }))
              }
              placeholder="admin@agrivet.ph"
              autoComplete="email"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Role"
            required
            htmlFor="role"
            hint="Super admins can also manage users, roles, and settings."
          >
            <Select
              value={values.role}
              onValueChange={(v) =>
                setValues((s) => ({ ...s, role: v as AuthUser["role"] }))
              }
            >
              <SelectTrigger id="role" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Account status"
            htmlFor="status"
            hint="Inactive and suspended accounts cannot sign in."
          >
            <Select
              value={values.status}
              onValueChange={(v) =>
                setValues((s) => ({
                  ...s,
                  status: v as AuthUser["status"],
                }))
              }
            >
              <SelectTrigger id="status" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </FormSection>

      {!initial && (
        <FormSection
          title="Security"
          description="Set a password for the new account."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="Password"
              required
              htmlFor="password"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={values.password ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormField>
            <FormField
              label="Confirm password"
              required
              htmlFor="confirmPassword"
            >
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="h-10"
              />
            </FormField>
          </div>
        </FormSection>
      )}

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          isSubmitting={submitting}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create account")}
        />
      )}
    </form>
  );
}

function validate(
  values: UserFormValues,
  confirmPassword: string,
  isEdit: boolean
): string | null {
  if (!values.name.trim()) return "Full name is required.";
  if (!values.email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    return "Enter a valid email address.";
  }

  if (isEdit) return null;

  if (!values.password) return "Password is required.";
  if (values.password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (values.password !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
}
