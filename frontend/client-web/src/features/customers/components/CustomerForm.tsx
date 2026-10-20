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
import { AddressSelector } from "@/components/common/AddressSelector";
import { NameSuffixSelect } from "@/components/common/NameSuffixSelect";

import type { Customer, CustomerFormValues } from "@/types/customer";
import { mockAgents } from "@/data/mock-agents";
import { computeFullName, emptyAddress } from "@/lib/utils";

interface CustomerFormProps {
  initial?: Customer;
  submitLabel?: string;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
}

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
  const [showPassword, setShowPassword] = useState(false);

  const previewName = computeFullName(
    values.firstName,
    values.middleName,
    values.lastName,
    values.suffix
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-12">
      <FormSection
        title="Personal information"
        description="The customer's legal name and primary contact details."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="First name" required htmlFor="firstName">
            <Input
              id="firstName"
              value={values.firstName}
              onChange={(e) =>
                setValues((v) => ({ ...v, firstName: e.target.value }))
              }
              placeholder="Ricardo"
              autoComplete="given-name"
              className="h-10"
            />
          </FormField>
          <FormField label="Middle name" optional htmlFor="middleName">
            <Input
              id="middleName"
              value={values.middleName}
              onChange={(e) =>
                setValues((v) => ({ ...v, middleName: e.target.value }))
              }
              placeholder="Middle name"
              autoComplete="additional-name"
              className="h-10"
            />
          </FormField>
          <FormField label="Last name" required htmlFor="lastName">
            <Input
              id="lastName"
              value={values.lastName}
              onChange={(e) =>
                setValues((v) => ({ ...v, lastName: e.target.value }))
              }
              placeholder="Bautista"
              autoComplete="family-name"
              className="h-10"
            />
          </FormField>
          <FormField label="Suffix" optional htmlFor="suffix">
            <NameSuffixSelect
              value={values.suffix}
              onChange={(suffix) => setValues((v) => ({ ...v, suffix }))}
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
          >
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) =>
                setValues((v) => ({ ...v, email: e.target.value }))
              }
              placeholder="customer@email.com"
              autoComplete="email"
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
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  contactNumber: e.target.value,
                }))
              }
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
          onChange={(addressParts) =>
            setValues((v) => ({ ...v, addressParts }))
          }
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
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={values.password}
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
            required={!initial}
            htmlFor="confirmPassword"
          >
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={values.confirmPassword}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder="••••••••"
              autoComplete="new-password"
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
          >
            <Select
              value={values.assignedAgentId}
              onValueChange={(v) =>
                setValues((s) => ({ ...s, assignedAgentId: v }))
              }
            >
              <SelectTrigger id="assignedAgentId" className="h-10">
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
