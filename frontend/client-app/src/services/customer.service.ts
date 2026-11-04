import { ApiError, request } from "@/lib/api-client";
import { normalizeAddress } from "@/lib/utils";
import type { AddressParts } from "@/types/auth";
import type { Customer, CustomerFormValues } from "@/types/customer";

interface ApiCustomer {
  id: string;
  fullName: string;
  contactNumber: string;
  gender: string | null;
  address: string;
  addressParts: AddressParts;
  assignedAgentId: string;
  assignedAgentName: string;
  status: "active" | "inactive";
  totalBookings: number;
  totalPurchases: number;
  notes: string | null;
  registeredDate: string;
}

interface ListCustomersResponse {
  customers: ApiCustomer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toCustomer(customer: ApiCustomer): Customer {
  return {
    id: customer.id,
    fullName: customer.fullName,
    contactNumber: customer.contactNumber,
    gender: customer.gender ?? undefined,
    address: customer.address,
    addressParts: normalizeAddress(customer.addressParts),
    assignedAgentId: customer.assignedAgentId,
    assignedAgentName: customer.assignedAgentName,
    totalBookings: customer.totalBookings,
    totalPurchases: customer.totalPurchases,
    status: customer.status,
    registeredDate: customer.registeredDate,
    notes: customer.notes ?? undefined,
  };
}

function toPayload(values: CustomerFormValues) {
  return {
    fullName: values.fullName.trim(),
    contactNumber: values.contactNumber.trim(),
    gender: values.gender?.trim() || undefined,
    addressParts: values.addressParts,
    notes: values.notes?.trim() || undefined,
  };
}

/**
 * The API scopes customers to the authenticated agent, so the legacy agentId
 * argument is kept only to avoid changing existing call sites.
 */
export async function listCustomersForAgent(
  _agentId?: string,
): Promise<Customer[]> {
  const result = await request<ListCustomersResponse>(
    "/customers?page=1&pageSize=200",
  );
  return result.customers.map(toCustomer);
}

export async function getCustomerForAgent(
  id: string,
  _agentId?: string,
): Promise<Customer | null> {
  try {
    const { customer } = await request<{ customer: ApiCustomer }>(
      `/customers/${encodeURIComponent(id)}`,
    );
    return toCustomer(customer);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createCustomerForAgent(
  values: CustomerFormValues,
  _agentId?: string,
  _agentName?: string,
): Promise<Customer> {
  const { customer } = await request<{ customer: ApiCustomer }>(
    "/customers",
    {
      method: "POST",
      body: toPayload(values),
    },
  );
  return toCustomer(customer);
}

export async function updateCustomerForAgent(
  id: string,
  values: CustomerFormValues,
  _agentId?: string,
): Promise<Customer | null> {
  const { customer } = await request<{ customer: ApiCustomer }>(
    `/customers/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: toPayload(values),
    },
  );
  return toCustomer(customer);
}
