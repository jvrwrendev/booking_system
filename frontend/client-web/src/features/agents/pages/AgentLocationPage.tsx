import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";

import { AgentLocationsProvider } from "../locations/hooks/useAgentLocations";
import { AgentTrackingTab } from "../locations/components/AgentTrackingTab";
import { AllLocationsTab } from "../locations/components/AllLocationsTab";

export function AgentLocationPage() {
  return (
    <AgentLocationsProvider>
      <div className="space-y-6">
        <PageHeader
          title="Location Tracking"
          description="Monitor sales agents in the field. Locations are simulated for demonstration."
          breadcrumbs={[{ label: "People" }, { label: "Agents" }, { label: "Location Tracking" }]}
        />

        <Tabs defaultValue="agent">
          <TabsList>
            <TabsTrigger value="agent">Agent Tracking</TabsTrigger>
            <TabsTrigger value="all">All Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="agent">
            <AgentTrackingTab />
          </TabsContent>

          <TabsContent value="all">
            <AllLocationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AgentLocationsProvider>
  );
}
