import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockAgents } from "@/data/mock-agents";
import type { Agent, AgentFormValues } from "@/types/agent";
import { computeFullName, formatAddress } from "@/lib/utils";

interface AgentsContextValue {
  agents: Agent[];
  addAgent: (data: AgentFormValues) => Agent;
  updateAgent: (id: string, data: AgentFormValues) => void;
  toggleStatus: (id: string, status: Agent["status"]) => void;
  getAgent: (id: string) => Agent | undefined;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

function nextId(existing: Agent[]): string {
  const max = existing
    .map((a) => Number(a.id.replace("AGT-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `AGT-${String(max + 1).padStart(3, "0")}`;
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);

  const value = useMemo<AgentsContextValue>(
    () => ({
      agents,
      addAgent: (data) => {
        const fullName = computeFullName(data.firstName, data.middleName, data.lastName, data.suffix);
        const address = formatAddress(data.addressParts);
        const agent: Agent = {
          id: nextId(agents),
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          suffix: data.suffix,
          fullName,
          email: data.email,
          password: data.password,
          contactNumber: data.contactNumber,
          address,
          addressParts: data.addressParts,
          status: data.status,
          totalBookings: 0,
          dateJoined: new Date().toISOString(),
        };
        setAgents((prev) => [agent, ...prev]);
        toast.success("Agent added", {
          description: `${fullName} has been added.`,
        });
        return agent;
      },
      updateAgent: (id, data) => {
        const fullName = computeFullName(data.firstName, data.middleName, data.lastName, data.suffix);
        const address = formatAddress(data.addressParts);
        setAgents((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  firstName: data.firstName,
                  middleName: data.middleName,
                  lastName: data.lastName,
                  suffix: data.suffix,
                  fullName,
                  email: data.email,
                  password: data.password,
                  contactNumber: data.contactNumber,
                  address,
                  addressParts: data.addressParts,
                  status: data.status,
                }
              : a
          )
        );
        toast.success("Agent updated");
      },
      toggleStatus: (id, status) => {
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        );
        toast.success("Agent status updated");
      },
      getAgent: (id) => agents.find((a) => a.id === id),
    }),
    [agents]
  );

  return (
    <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
  );
}

export function useAgentsStore() {
  const ctx = useContext(AgentsContext);
  if (!ctx) throw new Error("useAgentsStore must be used within AgentsProvider");
  return ctx;
}
