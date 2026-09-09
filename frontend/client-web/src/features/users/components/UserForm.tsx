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
import type { UserFormValues } from "../hooks/useUsersStore";

interface UserFormProps {
  initial?: AuthUser;
  submitLabel?: string;
  onSubmit: (data: UserFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", middleName: "", lastName: "", suffix: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "", suffix: "" };
  }
  if (parts.length === 2) {
    return {
      firstName: parts[0],
      middleName: "",
      lastName: parts[1],
      suffix: "",
    };
  }
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
    suffix: "",
  };
}

export function UserForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
}: UserFormProps) {
  const [values, setValues] = useState<UserFormValues>(
    initial
      ? {
          ...splitFullName(initial.fullName),
          email: initial.email,
          username: initial.username,
          role: initial.role,
          status: initial.status,
        }
      : {
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          email: "",
          username: "",
          role: "ADMIN",
          status: "active",
          password: "",
        }
  );
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !values.firstName.trim() ||
      !values.lastName.trim() ||
      !values.email.trim() ||
      !values.username.trim()
    ) {
      setError("All fields are required.");
      return;
    }
    if (!initial) {
      if (!values.password) {
        setError("Password is required.");
        return;
      }
      if (values.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (values.password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    const { password: _password, ...payload } = values;
    onSubmit(_password ? { ...payload, password: _password } : payload);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-12">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <FormSection
        title="User details"
        description="The account's name, login credentials, and the role it can access."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="First name"
            required
            htmlFor="firstName"
          >
            <Input
              id="firstName"
              value={values.firstName}
              onChange={(e) =>
                setValues((v) => ({ ...v, firstName: e.target.value }))
              }
              placeholder="e.g., Juan"
              autoComplete="given-name"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Middle name"
            htmlFor="middleName"
            hint="Leave blank if not applicable."
          >
            <Input
              id="middleName"
              value={values.middleName}
              onChange={(e) =>
                setValues((v) => ({ ...v, middleName: e.target.value }))
              }
              placeholder="e.g., Santos"
              autoComplete="additional-name"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Last name"
            required
            htmlFor="lastName"
          >
            <Input
              id="lastName"
              value={values.lastName}
              onChange={(e) =>
                setValues((v) => ({ ...v, lastName: e.target.value }))
              }
              placeholder="e.g., Dela Cruz"
              autoComplete="family-name"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Suffix"
            htmlFor="suffix"
            hint="e.g., Jr., Sr., III"
          >
            <Input
              id="suffix"
              value={values.suffix}
              onChange={(e) =>
                setValues((v) => ({ ...v, suffix: e.target.value }))
              }
              placeholder="e.g., Jr."
              autoComplete="honorific-suffix"
              className="h-10"
            />
          </FormField>
          <FormField label="Username" required htmlFor="username">
            <Input
              id="username"
              value={values.username}
              onChange={(e) =>
                setValues((v) => ({ ...v, username: e.target.value }))
              }
              placeholder="username"
              autoComplete="username"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Email"
            required
            htmlFor="email"
            hint="Used for signing in and notifications."
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
          <FormField label="Account status" htmlFor="status">
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
              hint="At least 6 characters."
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
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create account")}
        />
      )}
    </form>
  );
}