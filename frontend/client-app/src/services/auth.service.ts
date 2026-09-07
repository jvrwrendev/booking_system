import { mockAgentAuthAccounts, mockAgents } from "./mock/agents";
import { mockBranchAuthAccounts, mockBranches } from "./mock/branches";
import type { AuthAccount, AuthUser, LoginCredentials } from "@/types/auth";
import { NETWORK_DELAY_MS } from "@/constants";
import { sleep } from "@/lib/utils";

const combinedAccounts: AuthAccount[] = [
  ...mockAgentAuthAccounts,
  ...mockBranchAuthAccounts,
];

export async function loginRequest(
  credentials: LoginCredentials,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);
  const account = combinedAccounts.find(
    (a) => a.email.toLowerCase() === credentials.email.trim().toLowerCase(),
  );

  if (!account || account.password !== credentials.password) {
    return { success: false, error: "Invalid email or password." };
  }

  if (account.status !== "active") {
    return {
      success: false,
      error: "This account is inactive. Contact your administrator.",
    };
  }

  const { password: _password, ...userFields } = account;
  const user: AuthUser = {
    ...userFields,
    lastLogin: new Date().toISOString(),
  };

  if (user.role === "AGENT") {
    const agent = mockAgents.find((a) => a.id === user.agentId);
    if (agent) {
      user.fullName = agent.fullName;
      user.contactNumber = agent.contactNumber;
      user.address = agent.address;
    }
  } else if (user.role === "BRANCH") {
    const branch = mockBranches.find((b) => b.id === user.branchId);
    if (branch) {
      user.fullName = branch.name;
      user.contactNumber = branch.contactNumber;
      user.address = branch.address;
    }
  }

  return { success: true, user };
}

export async function fetchCurrentUser(userId: string): Promise<AuthUser | null> {
  await sleep(NETWORK_DELAY_MS);
  const account = combinedAccounts.find((a) => a.id === userId);
  if (!account) return null;
  const { password: _password, ...userFields } = account;
  return userFields;
}
