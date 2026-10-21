import { useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordInput } from "@/components/common/PasswordInput";
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
import {
  hasErrors,
  isBlank,
  isEmail,
  MIN_PASSWORD_LENGTH,
  type FieldErrors,
} from "@/lib/validation";

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
  const [errors, setErrors] = useState<FieldErrors<UserField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validate(values, confirmPassword, Boolean(initial));
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }
    // Drop the password on edit; changing it is a separate, admin-only action.
    const payload = initial
      ? { name: values.name, email: values.email, role: values.role, status: values.status }
      : values;
    await onSubmit(payload);
  };

  const visibleError = submitError;

  return (
    <form
      id={formId}
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-10"
      noValidate
    >
      {visibleError && (
        <Alert variant="destructive">
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
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
              error={errors.name}
            >
              <Input
                id="name"
                value={values.name}
                onChange={(e) => {
                  setValues((v) => ({ ...v, name: e.target.value }));
                  setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="e.g., Juan Dela Cruz"
                autoComplete="name"
                aria-invalid={!!errors.name}
                className="h-10"
              />
            </FormField>
          </div>
          <FormField
            label="Email"
            required
            htmlFor="email"
            hint="Used for signing in. Must be unique."
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => {
                setValues((v) => ({ ...v, email: e.target.value }));
                setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="admin@agrivet.ph"
              autoComplete="email"
              aria-invalid={!!errors.email}
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
              error={errors.password}
            >
              <PasswordInput
                id="password"
                value={values.password ?? ""}
                onChange={(e) => {
                  setValues((v) => ({ ...v, password: e.target.value }));
                  setErrors((e) => ({ ...e, password: undefined }));
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                className="h-10"
              />
            </FormField>
            <FormField
              label="Confirm password"
              required
              htmlFor="confirmPassword"
              error={errors.confirmPassword}
            >
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
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

type UserField = "name" | "email" | "password" | "confirmPassword";

function validate(
  values: UserFormValues,
  confirmPassword: string,
  isEdit: boolean
): FieldErrors<UserField> {
  const errors: FieldErrors<UserField> = {};

  if (isBlank(values.name)) {
    errors.name = "Full name is required.";
  }
  if (isBlank(values.email)) {
    errors.email = "Email is required.";
  } else if (!isEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!isEdit) {
    if (isBlank(values.password)) {
      errors.password = "Password is required.";
    } else if (values.password!.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (values.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}
