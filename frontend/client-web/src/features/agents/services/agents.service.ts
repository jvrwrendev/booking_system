import { request } from "@/lib/api-client";
import { emptyAddress, type AddressParts } from "@/lib/utils";
import type {
  AccountStatusDto,
  CreateUserPayloadDto,
  ListUsersResponseDto,
  PublicUserDto,
  UpdateUserPayloadDto,
} from "@/types/api";
import type { Agent, AgentFormValues, AgentStatus } from "@/types/agent";

const STATUS_TO_API: Record<AgentStatus, AccountStatusDto> = {
  active: "ACTIVE",
  inactive: "INACTIVE",
  suspended: "SUSPENDED",
};

const STATUS_TO_UI: Record<AccountStatusDto, AgentStatus> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

export function toAgent(dto: PublicUserDto): Agent {
  return {
    id: dto.id,
    fullName: dto.name,
    email: dto.email,
    contactNumber: dto.contactNumber ?? "",
    address: dto.address ?? "",
    addressParts: (dto.addressParts as AddressParts | undefined) ?? emptyAddress(),
    totalBookings: 0,
    status: STATUS_TO_UI[dto.status],
    dateJoined: dto.createdAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function listAgents(search?: string): Promise<Agent[]> {
  const pageSize = 100;
  const first = await request<ListUsersResponseDto>("/users", {
    query: { page: 1, pageSize, role: "AGENT", search },
  });

  const users = [...first.users];
  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await request<ListUsersResponseDto>("/users", {
      query: { page, pageSize, role: "AGENT", search },
    });
    users.push(...next.users);
  }

  return users.map(toAgent);
}

export async function getAgent(id: string): Promise<Agent> {
  const { user } = await request<{ user: PublicUserDto }>(`/users/${id}`);
  return toAgent(user);
}

function toPayload(values: AgentFormValues): UpdateUserPayloadDto {
  return {
    name: values.fullName.trim(),
    email: values.email.trim(),
    status: STATUS_TO_API[values.status],
    contactNumber: values.contactNumber.trim() || null,
    addressParts: values.addressParts,
  };
}

export async function createAgent(values: AgentFormValues): Promise<Agent> {
  const payload: CreateUserPayloadDto = {
    name: values.fullName.trim(),
    email: values.email.trim(),
    password: values.password,
    role: "AGENT",
    status: STATUS_TO_API[values.status],
    contactNumber: values.contactNumber.trim() || null,
    addressParts: values.addressParts,
  };

  const { user } = await request<{ user: PublicUserDto }>("/users", {
    method: "POST",
    body: payload,
  });
  return toAgent(user);
}

export async function updateAgent(
  id: string,
  values: AgentFormValues,
): Promise<Agent> {
  const { user } = await request<{ user: PublicUserDto }>(`/users/${id}`, {
    method: "PATCH",
    body: toPayload(values),
  });

  if (values.password) {
    await request<{ message: string }>(`/users/${id}/password`, {
      method: "PATCH",
      body: { password: values.password },
    });
  }

  return toAgent(user);
}

export async function setAgentStatus(
  id: string,
  status: AgentStatus,
): Promise<Agent> {
  const { user } = await request<{ user: PublicUserDto }>(
    `/users/${id}/status`,
    {
      method: "PATCH",
      body: { status: STATUS_TO_API[status] },
    },
  );
  return toAgent(user);
}
