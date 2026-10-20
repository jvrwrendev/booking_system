import { useNavigate, useParams } from "react-router-dom";

import { AgentForm } from "../components/AgentForm";
import { useAgentsStore } from "../hooks/useAgentsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { computeFullName, formatAddress } from "@/lib/utils";

export function AgentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgent, updateAgent } = useAgentsStore();
  const { can } = usePermissions();

  const agent = id ? getAgent(id) : undefined;

  if (!can("agents.manage")) {
    return <NotFound permission title="Permission denied" />;
  }
  if (!agent) {
    return <NotFound title="Agent not found" backHref="/agents" />;
  }

  const fullName = computeFullName(
    agent.firstName,
    agent.middleName,
    agent.lastName,
    agent.suffix
  );

  return (
    <FormPageLayout
      title={fullName}
      description="Update the details of this sales agent."
      backHref={`/agents/${agent.id}`}
      breadcrumbs={[
        { label: "People" },
        { label: "Agents", href: "/agents" },
        { label: fullName, href: `/agents/${agent.id}` },
        { label: "Edit" },
      ]}
      meta={[
        { label: "ID", value: agent.id },
        { label: "Status", value: agent.status },
        { label: "Joined", value: new Date(agent.dateJoined).toLocaleDateString() },
        { label: "Location", value: [agent.addressParts.city.name, agent.addressParts.region.name].filter(Boolean).join(", ") || "—" },
      ]}
    >
      <AgentForm
        initial={agent}
        onSubmit={(data) => {
          updateAgent(agent.id, data);
          navigate(`/agents/${agent.id}`);
        }}
        onCancel={() => navigate(`/agents/${agent.id}`)}
      />
    </FormPageLayout>
  );
}
