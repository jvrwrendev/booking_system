import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { ApiError } from "@/lib/api-client";
import { UserForm } from "./UserForm";
import { useUsersStore } from "../hooks/useUsersStore";

interface UserAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal-only replacement for the old `/users/add` page.
 */
export function UserAddDialog({ open, onOpenChange }: UserAddDialogProps) {
  const { addUser } = useUsersStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSubmitError(null);
  }, [open]);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add admin account"
      description="Create a new admin or super admin account with login credentials."
      icon={<UserPlus className="h-4 w-4" aria-hidden />}
      formId="user-add-form"
      submitLabel="Create account"
      submitting={submitting}
      hint="Fields marked with * are required."
    >
      {open && (
        <UserForm
          formId="user-add-form"
          hideFooter
          submitting={submitting}
          submitError={submitError}
          onSubmit={async (data) => {
            setSubmitting(true);
            setSubmitError(null);
            try {
              await addUser(data);
              onOpenChange(false);
            } catch (error) {
              setSubmitError(
                error instanceof ApiError
                  ? error.message
                  : "Could not create the account.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </FormDialog>
  );
}
