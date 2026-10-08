import type { Customer, CustomerFormValues } from "@/types/customer";
import { mockCustomers } from "./mock/customers";
import { sleep } from "@/lib/utils";
import { NETWORK_DELAY_MS } from "@/constants";

let customersState: Customer[] = [...mockCustomers];

function genId(): string {
  const max = customersState.reduce((acc, c) => {
    const num = parseInt(c.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(num) && num > acc ? num : acc;
  }, 0);
  return `CUS-${String(max + 1).padStart(3, "0")}`;
}

function buildFullName(c: CustomerFormValues): string {
  return [c.firstName, c.middleName, c.lastName, c.suffix]
    .filter((p) => p && p.trim())
    .join(" ");
}

function buildAddress(c: CustomerFormValues): string {
  return [
    c.addressParts.street,
    c.addressParts.barangay.name,
    c.addressParts.city.name,
    c.addressParts.province.name,
    c.addressParts.region.name,
  ]
    .filter((p) => p && p.trim())
    .join(", ");
}

export async function listCustomersForAgent(
  agentId: string,
): Promise<Customer[]> {
  await sleep(NETWORK_DELAY_MS);
  return customersState.filter((c) => c.assignedAgentId === agentId);
}

export async function getCustomerForAgent(
  id: string,
  agentId: string,
): Promise<Customer | null> {
  await sleep(NETWORK_DELAY_MS);
  const customer = customersState.find((c) => c.id === id);
  if (!customer) return null;
  if (customer.assignedAgentId !== agentId) return null;
  return customer;
}

export async function createCustomerForAgent(
  values: CustomerFormValues,
  agentId: string,
  agentName: string,
): Promise<Customer> {
  await sleep(NETWORK_DELAY_MS);
  const customer: Customer = {
    id: genId(),
    firstName: values.firstName,
    middleName: values.middleName,
    lastName: values.lastName,
    suffix: values.suffix,
    fullName: buildFullName(values),
    email: values.email,
    contactNumber: values.contactNumber,
    gender: values.gender,
    address: buildAddress(values),
    addressParts: values.addressParts,
    assignedAgentId: agentId,
    assignedAgentName: agentName,
    totalBookings: 0,
    totalPurchases: 0,
    status: "active",
    registeredDate: new Date().toISOString(),
    notes: values.notes ?? "",
  };
  customersState = [customer, ...customersState];
  return customer;
}

export async function updateCustomerForAgent(
  id: string,
  values: CustomerFormValues,
  agentId: string,
): Promise<Customer | null> {
  await sleep(NETWORK_DELAY_MS);
  const index = customersState.findIndex(
    (c) => c.id === id && c.assignedAgentId === agentId,
  );
  if (index === -1) return null;
  const existing = customersState[index];
  const updated: Customer = {
    ...existing,
    firstName: values.firstName,
    middleName: values.middleName,
    lastName: values.lastName,
    suffix: values.suffix,
    fullName: buildFullName(values),
    email: values.email,
    contactNumber: values.contactNumber,
    gender: values.gender,
    address: buildAddress(values),
    addressParts: values.addressParts,
    notes: values.notes ?? existing.notes,
  };
  customersState = customersState.map((c) => (c.id === id ? updated : c));
  return updated;
}
