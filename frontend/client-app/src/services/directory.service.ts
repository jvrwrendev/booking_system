import type { Agent } from "@/types/agent";
import type { Branch } from "@/types/branch";
import { mockAgents } from "./mock/agents";
import { mockBranches } from "./mock/branches";
import { sleep } from "@/lib/utils";
import { NETWORK_DELAY_MS } from "@/constants";

export async function getAgentById(id: string): Promise<Agent | null> {
  await sleep(NETWORK_DELAY_MS);
  return mockAgents.find((a) => a.id === id) ?? null;
}

export async function getBranchById(id: string): Promise<Branch | null> {
  await sleep(NETWORK_DELAY_MS);
  return mockBranches.find((b) => b.id === id) ?? null;
}
