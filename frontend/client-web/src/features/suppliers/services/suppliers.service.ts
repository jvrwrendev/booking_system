import { request } from "@/lib/api-client";
import type {
  CreateSupplierPayloadDto,
  ListSuppliersResponseDto,
  SupplierDto,
  UpdateSupplierPayloadDto,
} from "@/types/api";
import type {
  Supplier,
  SupplierFormValues,
  SupplierStatus,
} from "@/types/supplier";

export interface ListSuppliersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
  sortBy?: "name" | "createdAt";
  sortOrder?: "asc" | "desc";
}

function toStatusDto(status: SupplierStatus): "ACTIVE" | "INACTIVE" {
  return status === "inactive" ? "INACTIVE" : "ACTIVE";
}

export function toSupplier(dto: SupplierDto): Supplier {
  return {
    id: dto.id,
    name: dto.name,
    contactName: dto.contactName ?? undefined,
    contactNumber: dto.contactNumber ?? undefined,
    address: dto.address ?? undefined,
    status: dto.status === "ACTIVE" ? "active" : "inactive",
    productCount: dto.productCount ?? 0,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export async function listSuppliers(
  params: ListSuppliersParams = {},
): Promise<{
  suppliers: Supplier[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const result = await request<ListSuppliersResponseDto>("/suppliers", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });

  return {
    suppliers: result.suppliers.map(toSupplier),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  };
}

/**
 * Loads every matching supplier, paging through the API's 100-row cap. Used by
 * the product form so the picker can honestly show the full supplier list.
 */
export async function listAllSuppliers(
  params: Omit<ListSuppliersParams, "page" | "pageSize" | "sortBy" | "sortOrder"> = {},
): Promise<Supplier[]> {
  const pageSize = 100;
  const suppliers: Supplier[] = [];
  let page = 1;
  let total = 0;

  do {
    const result = await listSuppliers({ ...params, page, pageSize });
    suppliers.push(...result.suppliers);
    total = result.total;
    page += 1;
  } while (suppliers.length < total && page <= 100);

  return suppliers;
}

function toPayload(values: SupplierFormValues): CreateSupplierPayloadDto {
  return {
    name: values.name.trim(),
    contactName: values.contactName.trim() || undefined,
    contactNumber: values.contactNumber.trim() || undefined,
    address: values.address.trim() || undefined,
    status: toStatusDto(values.status),
  };
}

export async function getSupplier(id: string): Promise<Supplier> {
  const { supplier } = await request<{ supplier: SupplierDto }>(
    `/suppliers/${id}`,
  );
  return toSupplier(supplier);
}

export async function createSupplier(
  values: SupplierFormValues,
): Promise<Supplier> {  const { supplier } = await request<{ supplier: SupplierDto }>("/suppliers", {
    method: "POST",
    body: toPayload(values),
  });
  return toSupplier(supplier);
}

export async function updateSupplier(
  id: string,
  values: SupplierFormValues,
): Promise<Supplier> {
  const payload: UpdateSupplierPayloadDto = toPayload(values);
  const { supplier } = await request<{ supplier: SupplierDto }>(
    `/suppliers/${id}`,
    { method: "PATCH", body: payload },
  );
  return toSupplier(supplier);
}

export async function deleteSupplier(id: string): Promise<void> {
  await request<{ message: string }>(`/suppliers/${id}`, { method: "DELETE" });
}
