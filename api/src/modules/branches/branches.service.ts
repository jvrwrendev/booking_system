import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { hashPassword } from "../../lib/argon2.js";
import { Errors } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type {
  AddressPartsDto,
  CreateBranchDto,
  ListBranchesQueryDto,
  UpdateBranchDto,
} from "./dto/index.js";

const BRANCH_SELECT = {
  id: true,
  name: true,
  code: true,
  manager: true,
  contactNumber: true,
  address: true,
  addressParts: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  account: {
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      contactNumber: true,
      address: true,
    },
  },
  inventory: {
    select: { currentStock: true },
  },
} satisfies Prisma.BranchSelect;

type BranchRecord = Prisma.BranchGetPayload<{ select: typeof BRANCH_SELECT }>;

export interface BranchView {
  id: string;
  name: string;
  code: string;
  email: string;
  manager: string;
  contactNumber: string;
  address: string;
  addressParts: AddressPartsDto | null;
  totalProducts: number;
  totalStock: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

export interface ListBranchesResult {
  branches: BranchView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function toBranchView(branch: BranchRecord): BranchView {
  const totalStock = branch.inventory.reduce(
    (total, row) => total + row.currentStock,
    0,
  );

  return {
    id: branch.id,
    name: branch.name,
    code: branch.code ?? "",
    email: branch.account?.email ?? "",
    manager: branch.manager ?? branch.account?.name ?? "",
    contactNumber:
      branch.contactNumber ?? branch.account?.contactNumber ?? "",
    address: branch.address ?? branch.account?.address ?? "",
    addressParts: branch.addressParts as AddressPartsDto | null,
    totalProducts: branch.inventory.length,
    totalStock,
    status: branch.status === "ACTIVE" ? "active" : "inactive",
    createdAt: branch.createdAt,
    updatedAt: branch.updatedAt,
  };
}

function hasAddress(parts: AddressPartsDto | null | undefined): boolean {
  if (!parts) return false;

  return [
    parts.street,
    parts.purok,
    parts.barangay.name,
    parts.city.name,
    parts.region.name,
  ].some((part) => part.trim().length > 0);
}

function buildAddress(parts: AddressPartsDto | null | undefined): string {
  if (!parts) return "";

  return [
    parts.street,
    parts.purok,
    parts.barangay.name,
    parts.city.name,
    parts.province.name,
    parts.region.name,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function toAccountStatus(
  status: "ACTIVE" | "INACTIVE",
): "ACTIVE" | "INACTIVE" {
  return status;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function mustGetBranch(id: string): Promise<BranchRecord> {
  const branch = await prisma.branch.findUnique({
    where: { id },
    select: BRANCH_SELECT,
  });

  if (!branch) throw Errors.notFound("Branch not found");
  return branch;
}

export async function listBranches(
  query: ListBranchesQueryDto,
): Promise<ListBranchesResult> {
  const where: Prisma.BranchWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
      { manager: { contains: query.search, mode: "insensitive" } },
      { address: { contains: query.search, mode: "insensitive" } },
      {
        account: {
          is: { email: { contains: query.search, mode: "insensitive" } },
        },
      },
    ];
  }

  const [branches, total] = await Promise.all([
    prisma.branch.findMany({
      where,
      select: BRANCH_SELECT,
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.branch.count({ where }),
  ]);

  return {
    branches: branches.map(toBranchView),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
}

export async function getBranchById(id: string): Promise<BranchView> {
  return toBranchView(await mustGetBranch(id));
}

export async function createBranch(input: CreateBranchDto): Promise<BranchView> {
  const branchId = `BR-${randomUUID()}`;
  const hasAddressValue = hasAddress(input.addressParts);
  const address = hasAddressValue ? buildAddress(input.addressParts) : "";
  const passwordHash = await hashPassword(input.password);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.branch.create({
        data: {
          id: branchId,
          name: input.name,
          code: input.code,
          manager: input.manager || null,
          contactNumber: input.contactNumber || null,
          address: address || null,
          addressParts:
            input.addressParts && hasAddressValue
              ? (input.addressParts as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          status: input.status,
        },
      });

      await tx.user.create({
        data: {
          name: input.manager || input.name,
          email: input.email,
          passwordHash,
          role: "BRANCH",
          status: toAccountStatus(input.status),
          contactNumber: input.contactNumber || null,
          address: address || null,
          addressParts:
            input.addressParts && hasAddressValue
              ? (input.addressParts as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          branchId,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw Errors.conflict("That branch code or email is already in use");
    }
    throw error;
  }

  return getBranchById(branchId);
}

export async function updateBranch(
  id: string,
  input: UpdateBranchDto,
): Promise<BranchView> {
  const existing = await mustGetBranch(id);
  const hasAddressValue = hasAddress(input.addressParts);
  const address =
    input.addressParts !== undefined && hasAddressValue
      ? buildAddress(input.addressParts)
      : undefined;

  const branchData: Prisma.BranchUpdateInput = {};
  if (input.name !== undefined) branchData.name = input.name;
  if (input.code !== undefined) branchData.code = input.code;
  if (input.manager !== undefined) branchData.manager = input.manager || null;
  if (input.contactNumber !== undefined) {
    branchData.contactNumber = input.contactNumber || null;
  }
  if (input.addressParts !== undefined && hasAddressValue) {
    branchData.address = address || null;
    branchData.addressParts = input.addressParts as Prisma.InputJsonValue;
  }
  if (input.status !== undefined) branchData.status = input.status;

  const accountData: Prisma.UserUpdateInput = {};
  if (input.email !== undefined) accountData.email = input.email;
  if (input.password !== undefined) {
    accountData.passwordHash = await hashPassword(input.password);
  }
  if (input.manager !== undefined) {
    accountData.name = input.manager || input.name || existing.name;
  } else if (input.name !== undefined && !existing.account) {
    accountData.name = input.name;
  }
  if (input.contactNumber !== undefined) {
    accountData.contactNumber = input.contactNumber || null;
  }
  if (input.addressParts !== undefined && hasAddressValue) {
    accountData.address = address || null;
    accountData.addressParts = input.addressParts as Prisma.InputJsonValue;
  }
  if (input.status !== undefined) {
    accountData.status = toAccountStatus(input.status);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.branch.update({ where: { id }, data: branchData });

      if (existing.account) {
        if (Object.keys(accountData).length > 0) {
          await tx.user.update({
            where: { id: existing.account.id },
            data: accountData,
          });
        }
        return;
      }

      // Legacy branches created before branch accounts existed can be linked
      // once an email and password are supplied from the edit form.
      if (input.email && input.password) {
        await tx.user.create({
          data: {
            name: input.manager || input.name || existing.name,
            email: input.email,
            passwordHash: await hashPassword(input.password),
            role: "BRANCH",
            status: input.status ?? existing.status,
            contactNumber:
              input.contactNumber ?? existing.contactNumber ?? null,
            address: address ?? existing.address ?? null,
            addressParts:
              input.addressParts && hasAddressValue
                ? (input.addressParts as Prisma.InputJsonValue)
                : ((existing.addressParts as Prisma.InputJsonValue | null) ??
                  Prisma.JsonNull),
            branchId: id,
          },
        });
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw Errors.conflict("That branch code or email is already in use");
    }
    throw error;
  }

  return getBranchById(id);
}

export async function updateBranchStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<BranchView> {
  const existing = await mustGetBranch(id);

  await prisma.$transaction(async (tx) => {
    await tx.branch.update({ where: { id }, data: { status } });
    if (existing.account) {
      await tx.user.update({
        where: { id: existing.account.id },
        data: { status: toAccountStatus(status) },
      });
    }
  });

  return getBranchById(id);
}
