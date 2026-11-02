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

import type { Customer, CustomerFormValues } from "@/types/customer";
import { emptyAddress } from "@/lib/utils";
import { hasErrors, isBlank, type FieldErrors } from "@/lib/validation";
import { useAgentsStore } from "@/features/agents/hooks/useAgentsStore";

interface CustomerFormProps {
  initial?: Customer;
  submitLabel?: string;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

type CustomerField =
  | "fullName"
  | "contactNumber"
  | "assignedAgentId"
  | "address";

export function CustomerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
}: CustomerFormProps) {
  const { agents } = useAgentsStore();
  const [values, setValues] = useState<CustomerFormValues>(
    initial
      ? {
          fullName: initial.fullName,
          contactNumber: initial.contactNumber,
          gender: initial.gender,
          addressParts: initial.addressParts,
          assignedAgentId: initial.assignedAgentId,
          notes: initial.notes,
          status: initial.status,
        }
      : {
          fullName: "",
          contactNumber: "",
          gender: "",
          addressParts: emptyAddress(),
          assignedAgentId: "",
          notes: "",
          status: "active",
        },
  );
  const [errors, setErrors] = useState<FieldErrors<CustomerField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const update = <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: FieldErrors<CustomerField> = {};

    if (isBlank(values.fullName)) {
      nextErrors.fullName = "Full name is required.";
    }
    if (isBlank(values.contactNumber)) {
      nextErrors.contactNumber = "Contact number is required.";
    }
    if (isBlank(values.assignedAgentId)) {
      nextErrors.assignedAgentId = "Assign an agent to this customer.";
    }
    if (
      isBlank(values.addressParts.street) ||
      isBlank(values.addressParts.barangay.name) ||
      isBlank(values.addressParts.city.name) ||
      isBlank(values.addressParts.region.name)
    ) {
      nextErrors.address = "Complete the customer's address.";
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
        title="Customer information"
        description="The customer's name and primary contact details."
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
              placeholder="Ricardo Bautista"
              autoComplete="name"
              aria-invalid={!!errors.fullName}
              className="h-10"
            />
          </FormField>
          <FormField
            label="Contact number"
            required
            htmlFor="contactNumber"
            hint="Include country code, e.g. +63 9XX XXX XXXX."
            error={errors.contactNumber}
          >
            <Input
              id="contactNumber"
              value={values.contactNumber}
              onChange={(event) => update("contactNumber", event.target.value)}
              placeholder="+63 9XX XXX XXXX"
              autoComplete="tel"
              aria-invalid={!!errors.contactNumber}
              className="h-10"
            />
          </FormField>
          <FormField label="Gender" optional htmlFor="gender">
            <Select
              value={values.gender || "unspecified"}
              onValueChange={(value) =>
                update("gender", value === "unspecified" ? "" : value)
              }
            >
              <SelectTrigger id="gender" className="h-10">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">Not specified</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
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
        {errors.address && (
          <p className="text-xs font-medium text-destructive">{errors.address}</p>
        )}
      </FormSection>

      <FormSection
        title="Assignment & status"
        description="Assign a sales agent and control this customer's account."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="Assigned agent"
            required
            htmlFor="assignedAgentId"
            hint="Choose the agent who owns this customer."
            error={errors.assignedAgentId}
          >
            <Select
              value={values.assignedAgentId}
              onValueChange={(value) => update("assignedAgentId", value)}
            >
              <SelectTrigger
                id="assignedAgentId"
                className="h-10"
                aria-invalid={!!errors.assignedAgentId}
              >
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.fullName}
                    {agent.status !== "active" ? ` (${agent.status})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Status" htmlFor="status">
            <Select
              value={values.status}
              onValueChange={(value) =>
                update("status", value as Customer["status"])
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

        <FormField label="Notes" optional htmlFor="notes">
          <Input
            id="notes"
            value={values.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="Optional notes about this customer"
            className="h-10"
          />
        </FormField>
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
