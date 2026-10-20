import { useNavigate } from "react-router-dom";
import { Check, Info, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AgentForm } from "../components/AgentForm";
import { useAgentsStore } from "../hooks/useAgentsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { DetailsPanel } from "@/components/common/DetailsPanel";

export function AgentAddPage() {
  const navigate = useNavigate();
  const { addAgent, agents } = useAgentsStore();
  const { can } = usePermissions();

  if (!can("agents.manage")) {
    return <NotFound permission title="Permission denied" />;
  }

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;

  return (
    <FormPageLayout
      fullscreen
      title="Add agent"
      description="Create a new sales agent account. They will be able to manage customers and bookings once added."
      backHref="/agents"
      breadcrumbs={[
        { label: "People" },
        { label: "Agents", href: "/agents" },
        { label: "Add" },
      ]}
      topActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/agents")}
          >
            Cancel
          </Button>
          <Button type="submit" form="agent-add-form" className="min-w-[140px]">
            <UserPlus className="h-4 w-4" />
            Create agent
          </Button>
        </>
      }
      sidebar={
        <DetailsPanel
          title="Agent details"
          description="Helpful context before you save a new record."
          items={[
            {
              label: "Account type",
              value: "Sales agent",
              hint: "Handles bookings, customers, and on-site visits.",
            },
            {
              label: "Login method",
              value: "Email + password",
              hint: "Password must be at least 8 characters.",
            },
            {
              label: "Roster",
              value: `${activeAgents} of ${totalAgents} active`,
              hint: "Suspended agents keep their records but cannot sign in.",
            },
          ]}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Agents can be linked to one or more branches later from their
                profile page.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                New agents start as <span className="font-medium text-foreground">active</span> by
                default. Adjust status anytime from the agents list.
              </p>
            </div>
          </div>
        </DetailsPanel>
      }
    >
      <AgentForm
        formId="agent-add-form"
        hideFooter
        onSubmit={(data) => {
          addAgent(data);
          navigate("/agents");
        }}
        onCancel={() => navigate("/agents")}
      />
    </FormPageLayout>
  );
}