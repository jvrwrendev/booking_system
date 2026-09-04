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

import type { Branch, BranchFormValues } from "@/types/branch";
import { emptyAddress } from "@/lib/utils";

interface BranchFormProps {
  initial?: Branch;
  submitLabel?: string;
  onSubmit: (data: BranchFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-12">
      <FormSection
        title="Branch details"
        description="Basic information about the branch."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Branch name" required htmlFor="name">
            <Input
              id="name"
              value={values.name}
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="Quezon City Main Branch"
              className="h-10"
            />
          </FormField>
          <FormField
            label="Branch code"
            required
            htmlFor="code"
            hint="Short identifier. Will be auto-uppercased."
          >
            <Input
              id="code"
              value={values.code}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  code: e.target.value.toUpperCase(),
                }))
              }
              placeholder="AGR-QC"
              className="h-10 font-mono"
            />
          </FormField>
          <FormField label="Email" required htmlFor="email">
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) =>
                setValues((v) => ({ ...v, email: e.target.value }))
              }
              placeholder="branch@agrivet.ph"
              autoComplete="email"
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
              onChange={(e) =>
                setValues((v) => ({ ...v, manager: e.target.value }))
              }
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
          onChange={(addressParts) =>
            setValues((v) => ({ ...v, addressParts }))
          }
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
              onChange={(e) =>
                setValues((v) => ({ ...v, contactNumber: e.target.value }))
              }
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

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create branch")}
        />
      )}
    </form>
  );
}
