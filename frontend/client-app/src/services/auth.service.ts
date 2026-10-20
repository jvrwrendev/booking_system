import { ApiError, request } from "@/lib/api-client";
import { mockAgentAuthAccounts } from "./mock/agents";
import { mockBranchAuthAccounts } from "./mock/branches";
import { mockGoogleAccounts } from "./mock/google-accounts";
import type {
  AuthAccount,
  AuthUser,
  GoogleProfile,
  LoginCredentials,
  RegisterCredentials,
  UpdateProfileInput,
} from "@/types/auth";
import type { Role } from "@/types/role";
import { NETWORK_DELAY_MS } from "@/constants";
import { sleep } from "@/lib/utils";

/** Shape of the `user` object returned by the API's auth endpoints. */
interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  contactNumber: string | null;
  address: string | null;
  avatar: string | null;
  agentId: string | null;
  branchId: string | null;
  createdAt: string;
  updatedAt: string;
}

function toAuthUser(apiUser: ApiUser): AuthUser {
  return {
    id: apiUser.id,
    fullName: apiUser.name,
    email: apiUser.email,
    username: apiUser.email.split("@")[0],
    role: apiUser.role as Role,
    status: apiUser.status === "ACTIVE" ? "active" : "inactive",
    contactNumber: apiUser.contactNumber ?? undefined,
    address: apiUser.address ?? undefined,
    avatar: apiUser.avatar ?? undefined,
    agentId: apiUser.agentId ?? undefined,
    branchId: apiUser.branchId ?? undefined,
    createdAt: apiUser.createdAt,
    lastLogin: apiUser.updatedAt,
  };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "Something went wrong. Please try again.";
}

export async function loginRequest(
  credentials: LoginCredentials
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const data = await request<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: {
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      },
    });
    return { success: true, user: toAuthUser(data.user) };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function registerRequest(
  credentials: RegisterCredentials
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const data = await request<{ user: ApiUser }>("/auth/register", {
      method: "POST",
      body: {
        name: credentials.name.trim(),
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
        role: credentials.role,
        contactNumber: credentials.contactNumber.trim() || undefined,
        address: credentials.address.trim() || undefined,
        avatar: credentials.avatar || undefined,
      },
    });
    return { success: true, user: toAuthUser(data.user) };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function fetchCurrentUser(
  _userId: string
): Promise<AuthUser | null> {
  try {
    const data = await request<{ user: ApiUser }>("/auth/me");
    return toAuthUser(data.user);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) return null;
    if (error instanceof ApiError && error.code === "NETWORK_ERROR") {
      return null;
    }
    return null;
  }
}

export async function updateAccountRequest(
  _userId: string,
  patch: UpdateProfileInput
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    const data = await request<{ user: ApiUser }>("/auth/profile", {
      method: "PATCH",
      body: {
        name: patch.fullName.trim(),
        email: patch.email.trim().toLowerCase(),
        contactNumber: patch.contactNumber.trim(),
        address: patch.address.trim(),
        avatar: patch.avatar || null,
      },
    });
    return { success: true, user: toAuthUser(data.user) };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function changePasswordRequest(
  _userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await request("/auth/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function logoutRequest(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Best-effort: the local session is cleared regardless.
  }
}

export function listGoogleAccounts(): GoogleProfile[] {
  return mockGoogleAccounts;
}

const mockAuthAccounts: AuthAccount[] = [
  ...mockAgentAuthAccounts,
  ...mockBranchAuthAccounts,
];

function stripPassword(account: AuthAccount): AuthUser {
  const { password: _password, ...user } = account;
  return user;
}

export async function googleSignInRequest(
  profile: GoogleProfile
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);

  const account = mockAuthAccounts.find(
    (a) => a.email.toLowerCase() === profile.email.trim().toLowerCase()
  );

  if (!account) {
    return {
      success: false,
      error:
        "No Agrivet account is linked to this Google account. Create one first.",
    };
  }

  if (account.status !== "active") {
    return {
      success: false,
      error: "This account is inactive. Contact your administrator.",
    };
  }

  return { success: true, user: stripPassword(account) };
}

export async function googleSignUpRequest(
  profile: GoogleProfile,
  role: Role
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  await sleep(NETWORK_DELAY_MS);

  const email = profile.email.trim().toLowerCase();
  if (mockAuthAccounts.some((a) => a.email.toLowerCase() === email)) {
    return {
      success: false,
      error: "An account with this email already exists. Sign in instead.",
    };
  }

  const now = new Date().toISOString();
  const suffix = Date.now().toString(36).toUpperCase();
  const id = role === "AGENT" ? `AGT-${suffix}` : `BR-${suffix}`;

  const user: AuthUser = {
    id,
    fullName: profile.fullName.trim(),
    email,
    username: email.split("@")[0],
    role,
    status: "active",
    contactNumber: "",
    address: "",
    lastLogin: now,
    createdAt: now,
    agentId: role === "AGENT" ? id : undefined,
    branchId: role === "BRANCH" ? id : undefined,
  };

  return { success: true, user };
}
