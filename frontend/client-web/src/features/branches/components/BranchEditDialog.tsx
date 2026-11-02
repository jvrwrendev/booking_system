import { useState } from "react";
import { Building2 } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { BranchForm } from "./BranchForm";
import { useBranchesStore } from "../hooks/useBranchesStore";
import type { Branch } from "@/types/branch";

interface BranchEditDialogProps {
  /** The branch to edit. `null` closes the dialog. */
  branch: Branch | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inline replacement for the old `/branches/:id/edit` page.
 */
export function BranchEditDialog({
  branch,
  onOpenChange,
}: BranchEditDialogProps) {
  const { updateBranch } = useBranchesStore();
  const [saving, setSaving] = useState(false);

  return (
    <FormDialog
      open={!!branch}
      onOpenChange={onOpenChange}
      title={`Edit ${branch?.name ?? "branch"}`}
      description="Update this branch's contact details, address and account status."
      icon={<Building2 className="h-4 w-4" aria-hidden />}
      formId="branch-edit-form"
      submitLabel="Save changes"
      submitting={saving}
    >
      {branch && (
        <BranchForm
          formId="branch-edit-form"
          initial={branch}
          hideFooter
          onSubmit={async (data) => {
            setSaving(true);
            try {
              await updateBranch(branch.id, data);
              onOpenChange(false);
            } catch {
              // The store already surfaced the API error.
            } finally {
              setSaving(false);
            }
          }}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </FormDialog>
  );
}
