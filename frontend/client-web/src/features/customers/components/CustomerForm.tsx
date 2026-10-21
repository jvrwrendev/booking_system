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

import type { Customer, CustomerFormValues } from "@/types/customer";
import { mockAgents } from "@/data/mock-agents";
import { computeFullName, emptyAddress } from "@/lib/utils";
import {
  hasErrors,
  isBlank,
  validatePersonFields,
  type FieldErrors,
} from "@/lib/validation";

interface CustomerFormProps {
  initial?: Customer;
  submitLabel?: string;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

type CustomerField =
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"
  | "assignedAgentId";

export function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
}: CustomerFormProps) {
  const [values, setValues] = useState<CustomerFormValues>(
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
          assignedAgentId: initial.assignedAgentId,
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
          assignedAgentId: "",
          status: "active",
        }
  );
  const [errors, setErrors] = useState<FieldErrors<CustomerField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const previewName = computeFullName(
    values.firstName,
    values.middleName,
    values.lastName,
    values.suffix
  );

  /** Clears a field's message as soon as the user edits it. */
  const update = <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K]
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
      requirePassword: !initial,
    });

    // A blank password while editing means "leave it unchanged".
    if (initial && !values.password) {
      delete nextErrors.password;
      delete nextErrors.confirmPassword;
    }

    if (isBlank(values.assignedAgentId)) {
      nextErrors.assignedAgentId = "Assign an agent to this customer.";
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
        description="The customer's legal name and primary contact details."
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
              placeholder="Ricardo"
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
              placeholder="Bautista"
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
              placeholder="customer@email.com"
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
        description="Select the customer's location in the Philippines."
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
            : "Set a password for the new customer account."
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
        title="Assignment & status"
        description="Assign a sales agent and control account access."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Assigned agent"
            required
            htmlFor="assignedAgentId"
            hint="Only active agents are listed."
            error={errors.assignedAgentId}
          >
            <Select
              value={values.assignedAgentId}
              onValueChange={(v) => update("assignedAgentId", v)}
            >
              <SelectTrigger
                id="assignedAgentId"
                className="h-10"
                aria-invalid={!!errors.assignedAgentId}
              >
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {mockAgents
                  .filter((a) => a.status === "active")
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Account status" htmlFor="status">
            <Select
              value={values.status}
              onValueChange={(v) =>
                setValues((s) => ({
                  ...s,
                  status: v as Customer["status"],
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

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create customer")}
        />
      )}
    </form>
  );
}
