import { mockAgentAuthAccounts, mockAgents } from "./mock/agents";
import { mockBranchAuthAccounts, mockBranches } from "./mock/branches";
import type {
  AuthAccount,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileInput,
} from "@/types/auth";
import { NETWORK_DELAY_MS } from "@/constants";
import { sleep } from "@/lib/utils";

const combinedAccounts: AuthAccount[] = [
  ...mockAgentAuthAccounts,
  ...mockBranchAuthAccounts,
];

export async function loginRequest(
  credentials: LoginCredentials
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);
  const account = combinedAccounts.find(
    (a) => a.email.toLowerCase() === credentials.email.trim().toLowerCase()
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
  credentials: RegisterCredentials
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);

  const email = credentials.email.trim().toLowerCase();
  if (combinedAccounts.some((a) => a.email.toLowerCase() === email)) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
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

export async function fetchCurrentUser(
  userId: string
): Promise<AuthUser | null> {
  await sleep(NETWORK_DELAY_MS);
  const account = combinedAccounts.find((a) => a.id === userId);
  if (!account) return null;
  const { password: _password, ...userFields } = account;
  return userFields;
}

export async function updateAccountRequest(
  userId: string,
  patch: UpdateProfileInput
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);

  const account = combinedAccounts.find((a) => a.id === userId);
  if (!account) {
    return { success: false, error: "Account not found." };
  }

  const fullName = patch.fullName.trim();
  const email = patch.email.trim();
  const contactNumber = patch.contactNumber.trim();
  const address = patch.address.trim();

  if (!fullName) {
    return { success: false, error: "Full name is required." };
  }
  if (
    combinedAccounts.some(
      (a) => a.id !== userId && a.email.toLowerCase() === email.toLowerCase()
    )
  ) {
    return {
      success: false,
      error: "An account with this email already exists.",
    };
  }

  account.fullName = fullName;
  account.email = email;
  account.username = email.split("@")[0];
  account.contactNumber = contactNumber;
  account.address = address;

  if (account.role === "AGENT") {
    const agent = mockAgents.find((a) => a.id === account.agentId);
    if (agent) {
      agent.fullName = fullName;
      agent.email = email;
      agent.contactNumber = contactNumber;
      agent.address = address;
      const [first, ...rest] = fullName.split(" ");
      agent.firstName = first ?? agent.firstName;
      agent.lastName = rest.join(" ") || agent.lastName;
    }
  } else if (account.role === "BRANCH") {
    const branch = mockBranches.find((b) => b.id === account.branchId);
    if (branch) {
      branch.name = fullName;
      branch.email = email;
      branch.contactNumber = contactNumber;
      branch.address = address;
    }
  }

  const { password: _password, ...userFields } = account;
  return { success: true, user: userFields };
}

export async function changePasswordRequest(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  await sleep(NETWORK_DELAY_MS);

  const account = combinedAccounts.find((a) => a.id === userId);
  if (!account) {
    return { success: false, error: "Account not found." };
  }
  if (account.password !== currentPassword) {
    return { success: false, error: "Your current password is incorrect." };
  }
  if (currentPassword === newPassword) {
    return {
      success: false,
      error: "New password must be different from your current password.",
    };
  }

  account.password = newPassword;

  const agent = mockAgents.find((a) => a.id === account.agentId);
  if (agent) agent.password = newPassword;

  const branch = mockBranches.find((b) => b.id === account.branchId);
  if (branch) branch.password = newPassword;

  return { success: true };
}
