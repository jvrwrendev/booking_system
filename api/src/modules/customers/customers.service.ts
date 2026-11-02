import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  AddressPartsDto,
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from "./dto/index.js";

const CUSTOMER_SELECT = {
  id: true,
  fullName: true,
  contactNumber: true,
  gender: true,
  address: true,
  addressParts: true,
  agentId: true,
  agentName: true,
  status: true,
  totalBookings: true,
  totalPurchases: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerSelect;

type CustomerRecord = Prisma.CustomerGetPayload<{
  select: typeof CUSTOMER_SELECT;
}>;

export interface CustomerView {
  id: string;
  fullName: string;
  contactNumber: string;
  gender: string | null;
  address: string;
  addressParts: AddressPartsDto;
  assignedAgentId: string;
  assignedAgentName: string;
  status: "active" | "inactive";
  totalBookings: number;
  totalPurchases: number;
  notes: string | null;
  registeredDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListCustomersResult {
  customers: CustomerView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * PSGC region codes for the Mindanao island group. The mobile address picker
 * filters to these same regions, and the API validates them again so a direct
 * request cannot create a customer outside Mindanao.
 */
const MINDANAO_REGION_CODES = new Set([
  "0900000000", // Region IX (Zamboanga Peninsula)
  "1000000000", // Region X (Northern Mindanao)
  "1100000000", // Region XI (Davao Region)
  "1200000000", // Region XII (SOCCSKSARGEN)
  "1600000000", // Region XIII (Caraga)
  "1900000000", // BARMM
]);

const MINDANAO_REGION_NAME_HINTS = [
  "mindanao",
  "zamboanga peninsula",
  "davao region",
  "soccsksargen",
  "caraga",
  "bangsamoro",
  "barrm",
];

function toCustomerView(customer: CustomerRecord): CustomerView {
  return {
    id: customer.id,
    fullName: customer.fullName,
    contactNumber: customer.contactNumber,
    gender: customer.gender,
    address: customer.address,
    addressParts: customer.addressParts as AddressPartsDto,
    assignedAgentId: customer.agentId,
    assignedAgentName: customer.agentName,
    status: customer.status === "ACTIVE" ? "active" : "inactive",
    totalBookings: customer.totalBookings,
    totalPurchases: Number(customer.totalPurchases),
    notes: customer.notes,
    registeredDate: customer.createdAt,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  };
}

function buildAddress(parts: AddressPartsDto): string {
  return [
    parts.street,
    parts.barangay.name,
    parts.city.name,
    parts.province.name,
    parts.region.name,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function isMindanaoRegion(parts: AddressPartsDto): boolean {
  const code = parts.region.code.trim();
  if (code) return MINDANAO_REGION_CODES.has(code);

  const name = parts.region.name.toLowerCase();
  return MINDANAO_REGION_NAME_HINTS.some((hint) => name.includes(hint));
}

function assertMindanaoAddress(parts: AddressPartsDto): void {
  if (!isMindanaoRegion(parts)) {
    throw Errors.badRequest("Only addresses within Mindanao are allowed");
  }
}

function isUniqueCustomerError(error: unknown): boolean {
  return (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

async function assertNotDuplicate(
  agentId: string,
  fullName: string,
  contactNumber: string,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.customer.findFirst({
    where: {
      agentId,
      fullName: { equals: fullName, mode: "insensitive" },
      contactNumber,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw Errors.conflict(
      "A customer with the same name and contact number already exists",
    );
  }
}

async function mustGetCustomer(
  agentId: string,
  id: string,
): Promise<CustomerRecord> {
  const customer = await prisma.customer.findFirst({
    where: { id, agentId },
    select: CUSTOMER_SELECT,
  });

  if (!customer) throw Errors.notFound("Customer not found");
  return customer;
}

async function mustGetCustomerById(id: string): Promise<CustomerRecord> {
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: CUSTOMER_SELECT,
  });

  if (!customer) throw Errors.notFound("Customer not found");
  return customer;
}

async function resolveAgent(agentId: string): Promise<{ id: string; name: string }> {
  const agent = await prisma.user.findFirst({
    where: { id: agentId, role: "AGENT" },
    select: { id: true, name: true },
  });

  if (!agent) throw Errors.badRequest("Assigned agent was not found");
  return agent;
}

export async function listCustomers(
  agentId: string,
  query: ListCustomersQueryDto,
): Promise<ListCustomersResult> {
  const where: Prisma.CustomerWhereInput = { agentId };

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { contactNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: CUSTOMER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map(toCustomerView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function listAllCustomers(
  query: ListCustomersQueryDto,
): Promise<ListCustomersResult> {
  const where: Prisma.CustomerWhereInput = {};

  if (query.agentId) where.agentId = query.agentId;
  if (query.status) where.status = query.status;

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { contactNumber: { contains: query.search, mode: "insensitive" } },
      { agentName: { contains: query.search, mode: "insensitive" } },
      { address: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      select: CUSTOMER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers: customers.map(toCustomerView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getCustomerById(
  agentId: string,
  id: string,
): Promise<CustomerView> {
  return toCustomerView(await mustGetCustomer(agentId, id));
}

export async function getCustomerByIdAsAdmin(id: string): Promise<CustomerView> {
  return toCustomerView(await mustGetCustomerById(id));
}

export async function createCustomer(
  agentId: string,
  agentName: string,
  input: CreateCustomerDto,
): Promise<CustomerView> {
  assertMindanaoAddress(input.addressParts);
  await assertNotDuplicate(
    agentId,
    input.fullName,
    input.contactNumber,
  );

  try {
    const customer = await prisma.customer.create({
      data: {
        fullName: input.fullName,
        contactNumber: input.contactNumber,
        gender: input.gender || null,
        address: buildAddress(input.addressParts),
        addressParts: input.addressParts as Prisma.InputJsonValue,
        agentId,
        agentName,
        status: input.status ?? "ACTIVE",
        notes: input.notes || null,
      },
      select: CUSTOMER_SELECT,
    });

    return toCustomerView(customer);
  } catch (error) {
    if (isUniqueCustomerError(error)) {
      throw Errors.conflict(
        "A customer with the same name and contact number already exists",
      );
    }
    throw error;
  }
}

export async function updateCustomer(
  agentId: string,
  id: string,
  input: UpdateCustomerDto,
): Promise<CustomerView> {
  const existing = await mustGetCustomer(agentId, id);

  if (input.addressParts) {
    assertMindanaoAddress(input.addressParts);
  }

  const nextFullName = input.fullName ?? existing.fullName;
  const nextContactNumber =
    input.contactNumber ?? existing.contactNumber;

  await assertNotDuplicate(
    agentId,
    nextFullName,
    nextContactNumber,
    id,
  );

  const data: Prisma.CustomerUpdateInput = {};

  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.contactNumber !== undefined) {
    data.contactNumber = input.contactNumber;
  }
  if (input.gender !== undefined) data.gender = input.gender || null;
  if (input.notes !== undefined) data.notes = input.notes || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.addressParts !== undefined) {
    data.address = buildAddress(input.addressParts);
    data.addressParts = input.addressParts as Prisma.InputJsonValue;
  }

  try {
    const updated = await prisma.customer.update({
      where: { id },
      data,
      select: CUSTOMER_SELECT,
    });
    return toCustomerView(updated);
  } catch (error) {
    if (isUniqueCustomerError(error)) {
      throw Errors.conflict(
        "A customer with the same name and contact number already exists",
      );
    }
    throw error;
  }
}

export async function createCustomerAsAdmin(
  input: CreateCustomerDto,
): Promise<CustomerView> {
  if (!input.assignedAgentId) {
    throw Errors.badRequest("Assign an agent to this customer");
  }

  const agent = await resolveAgent(input.assignedAgentId);
  return createCustomer(agent.id, agent.name, input);
}

export async function updateCustomerAsAdmin(
  id: string,
  input: UpdateCustomerDto,
): Promise<CustomerView> {
  const existing = await mustGetCustomerById(id);

  if (input.addressParts) {
    assertMindanaoAddress(input.addressParts);
  }

  const agent =
    input.assignedAgentId && input.assignedAgentId !== existing.agentId
      ? await resolveAgent(input.assignedAgentId)
      : { id: existing.agentId, name: existing.agentName };

  const nextFullName = input.fullName ?? existing.fullName;
  const nextContactNumber = input.contactNumber ?? existing.contactNumber;

  await assertNotDuplicate(agent.id, nextFullName, nextContactNumber, id);

  const data: Prisma.CustomerUncheckedUpdateInput = {};

  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.contactNumber !== undefined) {
    data.contactNumber = input.contactNumber;
  }
  if (input.gender !== undefined) data.gender = input.gender || null;
  if (input.notes !== undefined) data.notes = input.notes || null;
  if (input.status !== undefined) data.status = input.status;
  if (input.assignedAgentId !== undefined) {
    data.agentId = agent.id;
    data.agentName = agent.name;
  }
  if (input.addressParts !== undefined) {
    data.address = buildAddress(input.addressParts);
    data.addressParts = input.addressParts as Prisma.InputJsonValue;
  }

  try {
    const updated = await prisma.customer.update({
      where: { id },
      data,
      select: CUSTOMER_SELECT,
    });
    return toCustomerView(updated);
  } catch (error) {
    if (isUniqueCustomerError(error)) {
      throw Errors.conflict(
        "A customer with the same name and contact number already exists",
      );
    }
    throw error;
  }
}
