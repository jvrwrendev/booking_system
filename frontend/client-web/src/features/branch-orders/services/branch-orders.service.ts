import { request } from "@/lib/api-client";
import type {
  ApplyBranchOrderDiscountPayloadDto,
  AssignBranchOrderPayloadDto,
  BranchOrderDto,
  BranchOrderStatusDto,
  CreateBranchOrderPayloadDto,
  ListBranchOrdersResponseDto,
  UpdateBranchOrderPayloadDto,
} from "@/types/api";
import type { BranchOrder, BranchOrderStatus } from "@/types/branch-order";

export interface ListBranchOrdersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  branchId?: string;
  assignedAdminId?: string;
  assignment?: "assigned" | "unassigned";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

function toBranchOrderStatus(status: BranchOrderStatusDto): BranchOrderStatus {
  return status.toLowerCase() as BranchOrderStatus;
}

export function toBranchOrder(dto: BranchOrderDto): BranchOrder {
  return {
    id: dto.id,
    reference: dto.reference,
    branchId: dto.branchId,
    branchName: dto.branchName,
    branchManager: dto.branchManager,
    branchContact: dto.branchContact,
    branchAddress: dto.branchAddress,
    orderDate: dto.orderDate,
    items: dto.items.map((item) => ({
      productId: item.productId ?? undefined,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    totalQuantity: dto.totalQuantity,
    subtotal: dto.subtotal,
    discount: dto.discount,
    totalAmount: dto.totalAmount,
    status: toBranchOrderStatus(dto.status),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    notes: dto.notes ?? undefined,
    assignedAdminId: dto.assignedAdminId,
    assignedAdminName: dto.assignedAdminName,
    assignedById: dto.assignedById,
    assignedByName: dto.assignedByName,
    assignmentDate: dto.assignmentDate,
    statusHistory: dto.statusHistory.map((entry) => ({
      id: entry.id,
      from: entry.from,
      to: entry.to,
      label: entry.label,
      timestamp: entry.timestamp,
      by: entry.by,
    })),
  };
}

export async function listBranchOrders(
  params: ListBranchOrdersParams = {},
): Promise<{
  branchOrders: BranchOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const result = await request<ListBranchOrdersResponseDto>("/branch-orders", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status:
        params.status && params.status !== "all"
          ? (params.status.toUpperCase() as BranchOrderStatusDto)
          : undefined,
      branchId:
        params.branchId && params.branchId !== "all"
          ? params.branchId
          : undefined,
      assignedAdminId: params.assignedAdminId,
      assignment: params.assignment,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    },
  });

  return {
    ...result,
    branchOrders: result.branchOrders.map(toBranchOrder),
  };
}

export async function getBranchOrder(id: string): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    `/branch-orders/${encodeURIComponent(id)}`,
  );
  return toBranchOrder(branchOrder);
}

export async function createBranchOrder(
  payload: CreateBranchOrderPayloadDto,
): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    "/branch-orders",
    { method: "POST", body: payload },
  );
  return toBranchOrder(branchOrder);
}

export async function updateBranchOrder(
  id: string,
  payload: UpdateBranchOrderPayloadDto,
): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    `/branch-orders/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload },
  );
  return toBranchOrder(branchOrder);
}

export async function deleteBranchOrder(
  id: string,
): Promise<{ message: string }> {
  return request<{ message: string }>(
    `/branch-orders/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function updateBranchOrderStatus(
  id: string,
  status: BranchOrderStatus,
  note?: string,
): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    `/branch-orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: {
        status: status.toUpperCase() as BranchOrderStatusDto,
        ...(note ? { note } : {}),
      },
    },
  );
  return toBranchOrder(branchOrder);
}

export async function assignBranchOrder(
  id: string,
  payload: AssignBranchOrderPayloadDto,
): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    `/branch-orders/${encodeURIComponent(id)}/assign`,
    { method: "PATCH", body: payload },
  );
  return toBranchOrder(branchOrder);
}

export async function unassignBranchOrder(id: string): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    `/branch-orders/${encodeURIComponent(id)}/assignment`,
    { method: "DELETE" },
  );
  return toBranchOrder(branchOrder);
}

export async function applyBranchOrderDiscount(
  id: string,
  payload: ApplyBranchOrderDiscountPayloadDto,
): Promise<BranchOrder> {
  const { branchOrder } = await request<{ branchOrder: BranchOrderDto }>(
    `/branch-orders/${encodeURIComponent(id)}/discount`,
    { method: "PATCH", body: payload },
  );
  return toBranchOrder(branchOrder);
}
