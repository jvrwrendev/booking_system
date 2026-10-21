import { useState } from "react";
import { Building2, Info, Phone, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormField,
  FormFooter,
  FormSection,
} from "@/components/common/FormPageLayout";
import type { Supplier, SupplierFormValues } from "@/types/supplier";
import { cn } from "@/lib/utils";

interface SupplierFormProps {
  initial?: Supplier;
  submitLabel?: string;
  onSubmit: (values: SupplierFormValues) => void;
  onCancel?: () => void;
  hideFooter?: boolean;
  formId?: string;
  dense?: boolean;
}

const EMPTY_VALUES: SupplierFormValues = {
  name: "",
  contactName: "",
  contactNumber: "",
  address: "",
  status: "active",
};

export function SupplierForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hideFooter = false,
  formId,
  dense = false,
}: SupplierFormProps) {
  const [values, setValues] = useState<SupplierFormValues>(
    initial
      ? {
          name: initial.name,
          contactName: initial.contactName ?? "",
          contactNumber: initial.contactNumber ?? "",
          address: initial.address ?? "",
          status: initial.status,
        }
      : EMPTY_VALUES,
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Supplier name is required.");
      return;
    }
    if (values.contactNumber.trim().length > 40) {
      setError("Contact number cannot exceed 40 characters.");
      return;
    }
    setError(null);
    onSubmit(values);
  };

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn(dense ? "space-y-6" : "space-y-12")}
    >
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <FormSection
        title="Supplier profile"
        description="The supplier's business name is shown across products and purchasing records."
      >
        <div
          className={cn(
            "grid gap-5 sm:grid-cols-2",
            !dense && "lg:grid-cols-3",
          )}
        >
          <FormField
            label="Supplier name"
            required
            htmlFor="name"
            hint="Use the registered business name."
          >
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={values.name}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g., NutriGrow Philippines"
                className="h-10 pl-9"
              />
            </div>
          </FormField>

          <FormField
            label="Status"
            htmlFor="status"
            hint="Inactive suppliers stay visible but should not be used for new purchases."
          >
            <Select
              value={values.status}
              onValueChange={(next) =>
                setValues((previous) => ({
                  ...previous,
                  status: next as Supplier["status"],
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

      <FormSection
        title="Contact details"
        description="Optional information used to reach the supplier's representative."
      >
        <div
          className={cn(
            "grid gap-5 sm:grid-cols-2",
            !dense && "lg:grid-cols-3",
          )}
        >
          <FormField
            label="Contact person"
            optional
            htmlFor="contactName"
            hint="The person you usually coordinate with."
          >
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contactName"
                value={values.contactName}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    contactName: event.target.value,
                  }))
                }
                placeholder="e.g., Maria Santos"
                className="h-10 pl-9"
              />
            </div>
          </FormField>

          <FormField
            label="Contact number"
            optional
            htmlFor="contactNumber"
            hint="Mobile or landline number."
          >
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="contactNumber"
                value={values.contactNumber}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    contactNumber: event.target.value,
                  }))
                }
                placeholder="e.g., +63 917 000 0000"
                className="h-10 pl-9"
              />
            </div>
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Address"
        description="Optional business address shown on the supplier record."
      >
        <FormField label="Address" optional htmlFor="address">
          <Textarea
            id="address"
            value={values.address}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                address: event.target.value,
              }))
            }
            rows={3}
            placeholder="Street, barangay, city, province"
            className="resize-none"
          />
        </FormField>
      </FormSection>

      <div className="flex items-start gap-2.5 rounded-md border bg-muted/30 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          After saving, this supplier becomes available in the product form.
          Linking a supplier is optional and can be changed at any time.
        </p>
      </div>

      {!hideFooter && (
        <FormFooter
          onCancel={onCancel}
          submitLabel={submitLabel ?? (initial ? "Save changes" : "Create supplier")}
        />
      )}
    </form>
  );
}
