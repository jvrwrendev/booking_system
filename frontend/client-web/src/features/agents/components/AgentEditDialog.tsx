import { useState } from "react";
import { UserCog } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { AgentForm } from "./AgentForm";
import { useAgentsStore } from "../hooks/useAgentsStore";
import { computeFullName } from "@/lib/utils";
import type { Agent } from "@/types/agent";

interface AgentEditDialogProps {
  /** The agent to edit. `null` closes the dialog. */
  agent: Agent | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inline replacement for the old `/agents/:id/edit` page.
 */
export function AgentEditDialog({ agent, onOpenChange }: AgentEditDialogProps) {
  const { updateAgent } = useAgentsStore();
  const [saving, setSaving] = useState(false);

  const fullName = agent
    ? computeFullName(
        agent.firstName,
        agent.middleName,
        agent.lastName,
        agent.suffix
      )
    : "";

  return (
    <FormDialog
      open={!!agent}
      onOpenChange={onOpenChange}
      title={`Edit ${fullName || "agent"}`}
      description="Update this agent's contact details, address and account status."
      icon={<UserCog className="h-4 w-4" aria-hidden />}
      formId="agent-edit-form"
      submitLabel="Save changes"
      submitting={saving}
    >
      {agent && (
        <AgentForm
          formId="agent-edit-form"
          initial={agent}
          hideFooter
          onSubmit={(data) => {
            setSaving(true);
            updateAgent(agent.id, data);
            setSaving(false);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      )}
    </FormDialog>
  );
}
