import { useRef, useState } from "react";

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
import { AddressSelector } from "@/components/common/AddressSelector";
import { PasswordInput } from "@/components/common/PasswordInput";

import type { Branch, BranchFormValues } from "@/types/branch";
import { emptyAddress } from "@/lib/utils";
import {
  hasErrors,
  isBlank,
  isEmail,
  MIN_PASSWORD_LENGTH,
  type FieldErrors,
} from "@/lib/validation";

interface BranchFormProps {
  initial?: Branch;
  submitLabel?: string;
  onSubmit: (data: BranchFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

type BranchField =
  | "name"
  | "code"
  | "email"
  | "password"
  | "confirmPassword";

function validateBranch(
  values: BranchFormValues,
  requirePassword: boolean
): FieldErrors<BranchField> {
  const errors: FieldErrors<BranchField> = {};

  if (isBlank(values.name)) {
    errors.name = "Branch name is required.";
  }
  if (isBlank(values.code)) {
    errors.code = "Branch code is required.";
  }
  if (isBlank(values.email)) {
    errors.email = "Email is required.";
  } else if (!isEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (requirePassword) {
    if (isBlank(values.password)) {
      errors.password = "Password is required.";
    } else if (values.password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (values.confirmPassword !== values.password) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

export function BranchForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
}: BranchFormProps) {
  const [values, setValues] = useState<BranchFormValues>(
    initial
      ? {
          name: initial.name,
          code: initial.code,
          email: initial.email,
          password: initial.password,
          confirmPassword: initial.password,
          manager: initial.manager,
          contactNumber: initial.contactNumber,
          addressParts: initial.addressParts,
          status: initial.status,
        }
      : {
          name: "",
          code: "",
          email: "",
          password: "",
          confirmPassword: "",
          manager: "",
          contactNumber: "",
          addressParts: emptyAddress(),
          status: "active",
        }
  );
  const [errors, setErrors] = useState<FieldErrors<BranchField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  /** Clears a field's message as soon as the user edits it. */
  const update = <K extends keyof BranchFormValues>(
    key: K,
    value: BranchFormValues[K]
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateBranch(values, !initial);

    // A blank password while editing means "leave it unchanged".
    if (initial && !values.password) {
      delete nextErrors.password;
      delete nextErrors.confirmPassword;
    }

    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    onSubmit(values);
  };

  return (
    <form
      id={formId}
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-10"
      noValidate
    >
      <FormSection
        title="Branch details"
        description="Basic information about the branch."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Branch name"
            required
            htmlFor="name"
            error={errors.name}
          >
            <Input
              id="name"
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Quezon City Main Branch"
              aria-invalid={!!errors.name}
              className="h-10"
            />
          </FormField>
          <FormField
            label="Branch code"
            required
            htmlFor="code"
            hint="Short identifier. Will be auto-uppercased."
            error={errors.code}
          >
            <Input
              id="code"
              value={values.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              placeholder="AGR-QC"
              aria-invalid={!!errors.code}
              className="h-10 font-mono"
            />
          </FormField>
          <FormField
            label="Email"
            required
            htmlFor="email"
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="branch@agrivet.ph"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="h-10"
            />
          </FormField>
          <FormField
            label="Branch manager"
            optional
            htmlFor="manager"
            hint="Full name of the branch manager."
          >
            <Input
              id="manager"
              value={values.manager}
              onChange={(e) => update("manager", e.target.value)}
              placeholder="Juan Dela Cruz"
              className="h-10"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Address"
        description="Select the branch's location in the Philippines."
      >
        <AddressSelector
          value={values.addressParts}
          onChange={(addressParts) => update("addressParts", addressParts)}
        />
      </FormSection>

      <FormSection
        title="Contact & status"
        description="Branch phone number and account status."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Contact number"
            optional
            htmlFor="contactNumber"
            hint="Landline or mobile, e.g. +63 2 XXX XXXX."
          >
            <Input
              id="contactNumber"
              value={values.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              placeholder="+63 2 XXX XXXX"
              autoComplete="tel"
              className="h-10"
            />
          </FormField>
          <FormField label="Account status" htmlFor="status">
            <Select
              value={values.status}
              onValueChange={(v) =>
                setValues((s) => ({ ...s, status: v as Branch["status"] }))
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

      <FormSection
        title="Security"
        description={
          initial
            ? "Leave blank to keep the current password."
            : "Set a password for the new branch account."
        }
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Password"
            required={!initial}
            htmlFor="password"
            hint="At least 8 characters."
            error={errors.password}
          >
            <PasswordInput
              id="password"
              value={values.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              className="h-10"
            />
          </FormField>
          <FormField
            label="Confirm password"
            required={!initial}
            htmlFor="confirmPassword"
            error={errors.confirmPassword}
          >
            <PasswordInput
              id="confirmPassword"
              value={values.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              className="h-10"
            />
          </FormField>
        </div>
      </FormSection>

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create branch")}
        />
      )}
    </form>
  );
}
