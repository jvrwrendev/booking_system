import { useState } from "react";
import { UserPlus } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { CustomerForm } from "./CustomerForm";
import { useCustomersStore } from "../hooks/useCustomersStore";

interface CustomerAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerAddDialog({
  open,
  onOpenChange,
}: CustomerAddDialogProps) {
  const { addCustomer } = useCustomersStore();
  const [saving, setSaving] = useState(false);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add customer"
      description="Create a customer record and assign it to a sales agent."
      icon={<UserPlus className="h-4 w-4" aria-hidden />}
      formId="customer-add-form"
      submitLabel="Create customer"
      submitting={saving}
    >
      <CustomerForm
        formId="customer-add-form"
        hideFooter
        onSubmit={async (data) => {
          setSaving(true);
          try {
            await addCustomer(data);
            onOpenChange(false);
          } catch {
            // The store already surfaced the API error.
          } finally {
            setSaving(false);
          }
        }}
        onCancel={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}
