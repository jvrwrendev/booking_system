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

import type { Agent, AgentFormValues } from "@/types/agent";
import { emptyAddress } from "@/lib/utils";
import {
  hasErrors,
  isBlank,
  isEmail,
  MIN_PASSWORD_LENGTH,
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

type AgentField = "fullName" | "email" | "password" | "confirmPassword";

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
          fullName: initial.fullName,
          email: initial.email,
          password: "",
          confirmPassword: "",
          contactNumber: initial.contactNumber,
          addressParts: initial.addressParts,
          status: initial.status,
        }
      : {
          fullName: "",
          email: "",
          password: "",
          confirmPassword: "",
          contactNumber: "",
          addressParts: emptyAddress(),
          status: "active",
        },
  );
  const [errors, setErrors] = useState<FieldErrors<AgentField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const update = <K extends keyof AgentFormValues>(
    key: K,
    value: AgentFormValues[K],
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: FieldErrors<AgentField> = {};

    if (isBlank(values.fullName)) {
      nextErrors.fullName = "Full name is required.";
    }
    if (isBlank(values.email)) {
      nextErrors.email = "Email is required.";
    } else if (!isEmail(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!initial) {
      if (isBlank(values.password)) {
        nextErrors.password = "Password is required.";
      } else if (values.password.length < MIN_PASSWORD_LENGTH) {
        nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
      if (values.confirmPassword !== values.password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    } else if (values.password) {
      if (values.password.length < MIN_PASSWORD_LENGTH) {
        nextErrors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
      }
      if (values.confirmPassword !== values.password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
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
        description="The agent's name and primary contact details."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Full name"
            required
            htmlFor="fullName"
            error={errors.fullName}
          >
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              placeholder="Roberto Garcia"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
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
              onChange={(event) => update("contactNumber", event.target.value)}
              placeholder="+63 9XX XXX XXXX"
              autoComplete="tel"
              className="h-10"
            />
          </FormField>
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
              onChange={(event) => update("email", event.target.value)}
              placeholder="agent@agrivet.ph"
              autoComplete="email"
              aria-invalid={!!errors.email}
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
              onChange={(event) => update("password", event.target.value)}
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
              value={values.confirmPassword ?? ""}
              onChange={(event) =>
                update("confirmPassword", event.target.value)
              }
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
              onValueChange={(value) =>
                update("status", value as Agent["status"])
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
