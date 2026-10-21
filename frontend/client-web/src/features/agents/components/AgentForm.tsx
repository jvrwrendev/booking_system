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
import { NameSuffixSelect } from "@/components/common/NameSuffixSelect";
import { PasswordInput } from "@/components/common/PasswordInput";

import type { Agent, AgentFormValues } from "@/types/agent";
import { computeFullName, emptyAddress } from "@/lib/utils";
import {
  hasErrors,
  validatePersonFields,
  type FieldErrors,
} from "@/lib/validation";

interface AgentFormProps {
  initial?: Agent;
  submitLabel?: string;
  onSubmit: (data: AgentFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

type AgentField =
  | "firstName"
  | "middleName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword";

export function AgentForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
}: AgentFormProps) {
  const [values, setValues] = useState<AgentFormValues>(
    initial
      ? {
          firstName: initial.firstName,
          middleName: initial.middleName,
          lastName: initial.lastName,
          suffix: initial.suffix,
          email: initial.email,
          password: initial.password,
          confirmPassword: initial.password,
          contactNumber: initial.contactNumber,
          addressParts: initial.addressParts,
          status: initial.status,
        }
      : {
          firstName: "",
          middleName: "",
          lastName: "",
          suffix: "",
          email: "",
          password: "",
          confirmPassword: "",
          contactNumber: "",
          addressParts: emptyAddress(),
          status: "active",
        }
  );
  const [errors, setErrors] = useState<FieldErrors<AgentField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const previewName = computeFullName(
    values.firstName,
    values.middleName,
    values.lastName,
    values.suffix
  );

  /** Clears a field's message as soon as the user edits it. */
  const update = <K extends keyof AgentFormValues>(
    key: K,
    value: AgentFormValues[K]
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validatePersonFields({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      // Editing keeps the existing password unless a new one is typed.
      requirePassword: !initial,
    });

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
        title="Personal information"
        description="The agent's legal name and primary contact details."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            label="First name"
            required
            htmlFor="firstName"
            error={errors.firstName}
          >
            <Input
              id="firstName"
              value={values.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Roberto"
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
              className="h-10"
            />
          </FormField>
          <FormField label="Middle name" optional htmlFor="middleName">
            <Input
              id="middleName"
              value={values.middleName}
              onChange={(e) => update("middleName", e.target.value)}
              placeholder="Middle name"
              autoComplete="additional-name"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Last name"
            required
            htmlFor="lastName"
            error={errors.lastName}
          >
            <Input
              id="lastName"
              value={values.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Garcia"
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
              className="h-10"
            />
          </FormField>
          <FormField label="Suffix" optional htmlFor="suffix">
            <NameSuffixSelect
              id="suffix"
              value={values.suffix}
              onChange={(suffix) => update("suffix", suffix)}
            />
          </FormField>
        </div>

        {previewName && (
          <p className="text-xs text-muted-foreground">
            Full name will appear as{" "}
            <span className="font-medium text-foreground">{previewName}</span>
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Email"
            required
            htmlFor="email"
            hint="Used for signing in and notifications."
            error={errors.email}
          >
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="agent@agrivet.ph"
              autoComplete="email"
              aria-invalid={!!errors.email}
              className="h-10"
            />
          </FormField>
          <FormField
            label="Contact number"
            optional
            htmlFor="contactNumber"
            hint="Include country code, e.g. +63 9XX XXX XXXX."
          >
            <Input
              id="contactNumber"
              value={values.contactNumber}
              onChange={(e) => update("contactNumber", e.target.value)}
              placeholder="+63 9XX XXX XXXX"
              autoComplete="tel"
              className="h-10"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Address"
        description="Select the agent's location in the Philippines."
      >
        <AddressSelector
          value={values.addressParts}
          onChange={(addressParts) => update("addressParts", addressParts)}
        />
      </FormSection>

      <FormSection
        title="Security"
        description={
          initial
            ? "Leave blank to keep the current password."
            : "Set a password for the new agent account."
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

      <FormSection
        title="Account status"
        description="Control whether this agent can sign in and access the system."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Status" htmlFor="status">
            <Select
              value={values.status}
              onValueChange={(v) =>
                setValues((s) => ({ ...s, status: v as Agent["status"] }))
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

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create agent")}
        />
      )}
    </form>
  );
}
