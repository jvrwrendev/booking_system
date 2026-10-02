import { mockAgentAuthAccounts, mockAgents } from "./mock/agents";
import { mockBranchAuthAccounts, mockBranches } from "./mock/branches";
import type {
  AuthAccount,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/types/auth";
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

export async function registerRequest(
  credentials: RegisterCredentials,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);

  const email = credentials.email.trim().toLowerCase();
  if (combinedAccounts.some((a) => a.email.toLowerCase() === email)) {
    return { success: false, error: "An account with this email already exists." };
  }

  const now = new Date().toISOString();
  const suffix = Date.now().toString(36).toUpperCase();
  const id = credentials.role === "AGENT" ? `AGT-${suffix}` : `BR-${suffix}`;

  const account: AuthAccount = {
    id,
    fullName: credentials.name.trim(),
    email: credentials.email.trim(),
    username: credentials.email.trim().split("@")[0],
    role: credentials.role,
    status: "active",
    contactNumber: credentials.contactNumber.trim(),
    address: credentials.address.trim(),
    lastLogin: now,
    createdAt: now,
    agentId: credentials.role === "AGENT" ? id : undefined,
    branchId: credentials.role === "BRANCH" ? id : undefined,
    password: credentials.password,
  };

  combinedAccounts.push(account);

  const { password: _password, ...userFields } = account;
  return { success: true, user: userFields };
}

export async function fetchCurrentUser(userId: string): Promise<AuthUser | null> {
  await sleep(NETWORK_DELAY_MS);
  const account = combinedAccounts.find((a) => a.id === userId);
  if (!account) return null;
  const { password: _password, ...userFields } = account;
  return userFields;
}
