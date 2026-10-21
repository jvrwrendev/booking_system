import { useState } from "react";
import { UserRoundPen } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { CustomerForm } from "./CustomerForm";
import { useCustomersStore } from "../hooks/useCustomersStore";
import { computeFullName } from "@/lib/utils";
import type { Customer } from "@/types/customer";

interface CustomerEditDialogProps {
  /** The customer to edit. `null` closes the dialog. */
  customer: Customer | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inline replacement for the old `/customers/:id/edit` page.
 */
export function CustomerEditDialog({
  customer,
  onOpenChange,
}: CustomerEditDialogProps) {
  const { updateCustomer } = useCustomersStore();
  const [saving, setSaving] = useState(false);

  const fullName = customer
    ? computeFullName(
        customer.firstName,
        customer.middleName,
        customer.lastName,
        customer.suffix
      )
    : "";

  return (
    <FormDialog
      open={!!customer}
      onOpenChange={onOpenChange}
      title={`Edit ${fullName || "customer"}`}
      description="Update this customer's contact details, address and assigned agent."
      icon={<UserRoundPen className="h-4 w-4" aria-hidden />}
      formId="customer-edit-form"
      submitLabel="Save changes"
      submitting={saving}
    >
      {customer && (
        <CustomerForm
          formId="customer-edit-form"
          initial={customer}
          hideFooter
          onSubmit={(data) => {
            setSaving(true);
            updateCustomer(customer.id, data);
            setSaving(false);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </FormDialog>
  );
}
