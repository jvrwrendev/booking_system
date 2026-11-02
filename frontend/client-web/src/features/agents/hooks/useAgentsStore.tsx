import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { ApiError } from "@/lib/api-client";
import type { Agent, AgentFormValues } from "@/types/agent";
import {
  createAgent as createAgentRequest,
  listAgents,
  setAgentStatus,
  updateAgent as updateAgentRequest,
} from "../services/agents.service";

interface AgentsContextValue {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addAgent: (data: AgentFormValues) => Promise<Agent>;
  updateAgent: (id: string, data: AgentFormValues) => Promise<Agent>;
  toggleStatus: (id: string, status: Agent["status"]) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
}

const AgentsContext = createContext<AgentsContextValue | null>(null);

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAgents(await listAgents());
    } catch (err) {
      setError(messageFor(err, "Could not load agents."));
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addAgent = useCallback(async (data: AgentFormValues) => {
    try {
      const created = await createAgentRequest(data);
      setAgents((previous) => [created, ...previous]);
      toast.success("Agent added", {
        description: `${created.fullName} has been added.`,
      });
      return created;
    } catch (err) {
      toast.error("Could not add agent", {
        description: messageFor(err, "Please try again."),
      });
      throw err;
    }
  }, []);

  const updateAgent = useCallback(async (id: string, data: AgentFormValues) => {
    try {
      const updated = await updateAgentRequest(id, data);
      setAgents((previous) =>
        previous.map((agent) => (agent.id === updated.id ? updated : agent)),
      );
      toast.success("Agent updated", {
        description: `${updated.fullName} was saved.`,
      });
      return updated;
    } catch (err) {
      toast.error("Could not update agent", {
        description: messageFor(err, "Please try again."),
      });
      throw err;
    }
  }, []);

  const toggleStatus = useCallback(
    async (id: string, status: Agent["status"]) => {
      try {
        const updated = await setAgentStatus(id, status);
        setAgents((previous) =>
          previous.map((agent) => (agent.id === updated.id ? updated : agent)),
        );
        toast.success("Agent status updated", {
          description: `${updated.fullName} is now ${updated.status}.`,
        });
      } catch (err) {
        toast.error("Could not update agent status", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [],
  );

  const value = useMemo<AgentsContextValue>(
    () => ({
      agents,
      loading,
      error,
      refresh,
      addAgent,
      updateAgent,
      toggleStatus,
      getAgent: (id) => agents.find((agent) => agent.id === id),
    }),
    [agents, loading, error, refresh, addAgent, updateAgent, toggleStatus],
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
