import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPinOff, Pause, Play } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { initials, relativeTime } from "@/lib/utils";

import { useAgentsStore } from "../../hooks/useAgentsStore";
import { useAgentLocations } from "../hooks/useAgentLocations";
import { AgentLocationMap } from "./AgentLocationMap";
import { LocationStatusBadge } from "./LocationStatusBadge";
import { toMapMarker } from "./toMapMarkers";
import type { MapMarker } from "./MapCanvas";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../data/mock-agent-locations";

export function AgentTrackingTab() {
  const { agents } = useAgentsStore();
  const { locations, loading, isLive, setIsLive, lastSyncedAt } =
    useAgentLocations();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [fitSignal, setFitSignal] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(true);

  // Default to the first agent that actually has a fix.
  useEffect(() => {
    if (selectedAgentId) return;
    const firstWithFix = locations.find(
      (l) => l.latitude !== null && l.longitude !== null
    );
    if (firstWithFix) setSelectedAgentId(firstWithFix.agentId);
  }, [locations, selectedAgentId]);

  // Switching agents always re-centres and re-opens their callout.
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setIsPopupOpen(true);
    setFitSignal((n) => n + 1);
  };

  const location = useMemo(
    () => locations.find((l) => l.agentId === selectedAgentId),
    [locations, selectedAgentId]
  );

  const agent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId),
    [agents, selectedAgentId]
  );

  const marker = location ? toMapMarker(location) : null;
  const markers: MapMarker[] = marker ? [marker] : [];
  const hasFix = location != null && location.latitude !== null;

  const initialCenter = marker
    ? { latitude: marker.latitude, longitude: marker.longitude }
    : DEFAULT_MAP_CENTER;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1 space-y-1.5">
            <Label htmlFor="tracking-agent">Agent</Label>
            <Select value={selectedAgentId} onValueChange={handleSelectAgent}>
              <SelectTrigger id="tracking-agent" className="h-9">
                <SelectValue placeholder="Select an agent to track" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pb-0.5">
            <Switch
              id="live-updates"
              checked={isLive}
              onCheckedChange={setIsLive}
            />
            <Label htmlFor="live-updates" className="flex items-center gap-1.5">
              {isLive ? (
                <Play className="h-3 w-3 text-primary" />
              ) : (
                <Pause className="h-3 w-3 text-muted-foreground" />
              )}
              Live updates
            </Label>
          </div>
        </div>

        <AgentLocationMap
          markers={markers}
          selectedId={isPopupOpen && marker ? marker.id : null}
          // Marker click re-opens the callout; its × sends null to dismiss it.
          onSelect={(id) => setIsPopupOpen(id !== null)}
          initialCenter={initialCenter}
          initialZoom={hasFix ? 13 : DEFAULT_MAP_ZOOM}
          selectedZoom={14}
          fitSignal={fitSignal}
          className="h-[420px] border"
          onRecenterClick={() => setFitSignal((n) => n + 1)}
        />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Current location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {loading && locations.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading location data...
              </div>
            ) : !selectedAgentId ? (
              <p className="text-muted-foreground">
                Select an agent to see their current location.
              </p>
            ) : !location ? (
              <p className="text-muted-foreground">
                No location record for {agent?.fullName ?? "this agent"}.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>
                      {initials(location.agentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {location.agentName}
                    </div>
                    <LocationStatusBadge status={location.status} />
                  </div>
                </div>

                <Separator />

                <dl className="space-y-3">
                  <Row label="Last known location">
                    {hasFix ? (
                      location.locationLabel
                    ) : (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <MapPinOff className="h-3.5 w-3.5" />
                        Location unavailable
                      </span>
                    )}
                  </Row>
                  <Row label="Coordinates">
                    {hasFix
                      ? `${location.latitude?.toFixed(5)}, ${location.longitude?.toFixed(5)}`
                      : "—"}
                  </Row>
                  <Row label="Last updated">
                    {relativeTime(location.lastUpdated)}
                  </Row>
                </dl>

                {lastSyncedAt && (
                  <p className="border-t pt-3 text-xs text-muted-foreground">
                    Feed synced {relativeTime(lastSyncedAt)}
                    {isLive ? " · simulating" : " · paused"}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
