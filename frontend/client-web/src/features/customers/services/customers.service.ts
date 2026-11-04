import { request } from "@/lib/api-client";
import { normalizeAddress } from "@/lib/utils";
import type {
  CreateCustomerPayloadDto,
  CustomerDto,
  CustomerStatusDto,
  ListCustomersResponseDto,
  UpdateCustomerPayloadDto,
} from "@/types/api";
import type { Customer, CustomerFormValues } from "@/types/customer";

export interface ListCustomersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  agentId?: string;
  status?: "active" | "inactive";
}

function toStatusDto(status: Customer["status"]): CustomerStatusDto {
  return status === "inactive" ? "INACTIVE" : "ACTIVE";
}

export function toCustomer(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    fullName: dto.fullName,
    contactNumber: dto.contactNumber,
    gender: dto.gender ?? "",
    address: dto.address,
    addressParts: normalizeAddress(dto.addressParts),
    assignedAgentId: dto.assignedAgentId,
    assignedAgentName: dto.assignedAgentName,
    totalBookings: dto.totalBookings,
    totalPurchases: dto.totalPurchases,
    notes: dto.notes ?? "",
    status: dto.status,
    registeredDate: dto.registeredDate,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function listCustomers(
  params: ListCustomersParams = {},
): Promise<ListCustomersResponseDto> {
  return request<ListCustomersResponseDto>("/customers", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      agentId: params.agentId,
      status: params.status ? toStatusDto(params.status) : undefined,
    },
  });
}

export async function listAllCustomers(): Promise<Customer[]> {
  const pageSize = 200;
  const first = await listCustomers({ page: 1, pageSize });
  const dtos = [...first.customers];

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await listCustomers({ page, pageSize });
    dtos.push(...next.customers);
  }

  return dtos.map(toCustomer);
}

export async function getCustomer(id: string): Promise<Customer> {
  const { customer } = await request<{ customer: CustomerDto }>(
    `/customers/${id}`,
  );
  return toCustomer(customer);
}

function toPayload(values: CustomerFormValues): CreateCustomerPayloadDto {
  return {
    fullName: values.fullName.trim(),
    contactNumber: values.contactNumber.trim(),
    gender: values.gender.trim() || null,
    addressParts: values.addressParts,
    assignedAgentId: values.assignedAgentId,
    status: toStatusDto(values.status),
    notes: values.notes.trim() || null,
  };
}

export async function createCustomer(
  values: CustomerFormValues,
): Promise<Customer> {
  const { customer } = await request<{ customer: CustomerDto }>("/customers", {
    method: "POST",
    body: toPayload(values),
  });
  return toCustomer(customer);
}

export async function updateCustomer(
  id: string,
  values: CustomerFormValues,
): Promise<Customer> {
  const payload: UpdateCustomerPayloadDto = toPayload(values);
  const { customer } = await request<{ customer: CustomerDto }>(
    `/customers/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
  return toCustomer(customer);
}

export async function setCustomerStatus(
  id: string,
  status: Customer["status"],
): Promise<Customer> {
  const { customer } = await request<{ customer: CustomerDto }>(
    `/customers/${id}`,
    {
      method: "PATCH",
      body: { status: toStatusDto(status) } satisfies {
        status: CustomerStatusDto;
      },
    },
  );
  return toCustomer(customer);
}
