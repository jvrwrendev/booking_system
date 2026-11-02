import { request } from "@/lib/api-client";
import { emptyAddress, type AddressParts } from "@/lib/utils";
import type {
  BranchDto,
  BranchStatusDto,
  CreateBranchPayloadDto,
  ListBranchesResponseDto,
  UpdateBranchPayloadDto,
} from "@/types/api";
import type { Branch, BranchFormValues } from "@/types/branch";

export interface ListBranchesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "active" | "inactive";
}

function toStatusDto(status: Branch["status"]): BranchStatusDto {
  return status === "inactive" ? "INACTIVE" : "ACTIVE";
}

export function toBranch(dto: BranchDto): Branch {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    email: dto.email,
    manager: dto.manager,
    contactNumber: dto.contactNumber,
    address: dto.address,
    addressParts: (dto.addressParts as AddressParts | null) ?? emptyAddress(),
    totalProducts: dto.totalProducts,
    totalStock: dto.totalStock,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function listBranches(
  params: ListBranchesParams = {},
): Promise<ListBranchesResponseDto> {
  return request<ListBranchesResponseDto>("/branches", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status ? toStatusDto(params.status) : undefined,
    },
  });
}

export async function listAllBranches(): Promise<Branch[]> {
  const pageSize = 200;
  const first = await listBranches({ page: 1, pageSize });
  const dtos = [...first.branches];

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = await listBranches({ page, pageSize });
    dtos.push(...next.branches);
  }

  return dtos.map(toBranch);
}

export async function getBranch(id: string): Promise<Branch> {
  const { branch } = await request<{ branch: BranchDto }>(`/branches/${id}`);
  return toBranch(branch);
}

function toPayload(values: BranchFormValues): CreateBranchPayloadDto {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    email: values.email.trim(),
    password: values.password,
    manager: values.manager.trim() || undefined,
    contactNumber: values.contactNumber.trim() || undefined,
    addressParts: values.addressParts,
    status: toStatusDto(values.status),
  };
}

export async function createBranch(
  values: BranchFormValues,
): Promise<Branch> {
  const { branch } = await request<{ branch: BranchDto }>("/branches", {
    method: "POST",
    body: toPayload(values),
  });
  return toBranch(branch);
}

export async function updateBranch(
  id: string,
  values: BranchFormValues,
): Promise<Branch> {
  const payload: UpdateBranchPayloadDto = toPayload(values);
  if (!values.password) delete payload.password;

  const { branch } = await request<{ branch: BranchDto }>(`/branches/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return toBranch(branch);
}

export async function setBranchStatus(
  id: string,
  status: Branch["status"],
): Promise<Branch> {
  const { branch } = await request<{ branch: BranchDto }>(
    `/branches/${id}/status`,
    {
      method: "PATCH",
      body: { status: toStatusDto(status) },
    },
  );
  return toBranch(branch);
}
