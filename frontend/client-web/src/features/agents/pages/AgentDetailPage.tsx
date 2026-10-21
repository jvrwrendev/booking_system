import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, MapPin, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { PageHeader } from "@/components/common/PageHeader";
import { NotFound } from "@/components/common/NotFound";
import { DescriptionList } from "@/components/common/DescriptionList";

import { useAgentsStore } from "../hooks/useAgentsStore";
import { AgentEditDialog } from "../components/AgentEditDialog";
import { useCustomersStore } from "@/features/customers/hooks/useCustomersStore";
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { formatDate, initials } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getAgent } = useAgentsStore();
  const { customers } = useCustomersStore();
  const { bookings } = useBookingsStore();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const agent = id ? getAgent(id) : undefined;
  if (!agent) {
    return <NotFound title="Agent not found" backHref="/agents" />;
  }

  const agentCustomers = customers.filter((c) => c.assignedAgentId === agent.id);
  const agentBookings = bookings.filter((b) => b.agentId === agent.id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/agents")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to agents
      </Button>

      <PageHeader
        title={agent.fullName}
        description={agent.email}
        breadcrumbs={[
          { label: "People" },
          { label: "Agents", href: "/agents" },
          { label: agent.fullName },
        ]}
        actions={
          can("agents.manage") && (
            <Button onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback>{initials(agent.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-base font-semibold">{agent.fullName}</div>
                <StatusBadge
                  variant={getStatusVariant(agent.status)}
                  label={humanize(agent.status)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {agent.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {agent.contactNumber || "—"}
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {agent.address || "—"}
              </div>
            </div>
            <Separator />
            <DescriptionList
              items={[
                { label: "Date joined", value: formatDate(agent.dateJoined) },
                {
                  label: "Total bookings",
                  value: String(agent.totalBookings),
                },
              ]}
            />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Assigned customers</span>
                <span className="font-medium">{agentCustomers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bookings</span>
                <span className="font-medium">{agentBookings.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AgentEditDialog
        agent={editOpen ? agent : null}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

