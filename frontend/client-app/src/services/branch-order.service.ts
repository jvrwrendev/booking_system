import { ApiError, request } from "@/lib/api-client";
import type {
  BranchOrder,
  BranchOrderItem,
  BranchOrderStatus,
} from "@/types/branch-order";
import type { Product } from "@/types/product";

/**
 * Wire shapes returned by `api/src/modules/branch-orders`. Keep these local to
 * the service so the rest of the mobile app only sees the client model.
 */
type ApiBranchOrderStatus = Uppercase<BranchOrderStatus>;

interface ApiBranchOrderItem {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ApiBranchOrderStatusHistory {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: string;
  by: string;
}

interface ApiBranchOrder {
  id: string;
  reference: string;
  branchId: string;
  branchName: string;
  branchManager: string | null;
  branchContact: string | null;
  branchAddress: string | null;
  orderDate: string;
  items: ApiBranchOrderItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: ApiBranchOrderStatus;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignmentDate: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: ApiBranchOrderStatusHistory[];
}

interface ApiBranchOrderList {
  branchOrders: ApiBranchOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ApiBranchOrderResponse {
  branchOrder: ApiBranchOrder;
}

const LIST_PAGE_SIZE = 100;

function toBranchOrderStatus(status: ApiBranchOrderStatus): BranchOrderStatus {
  return status.toLowerCase() as BranchOrderStatus;
}

function toBranchOrder(dto: ApiBranchOrder): BranchOrder {
  return {
    id: dto.id,
    reference: dto.reference,
    branchId: dto.branchId,
    branchName: dto.branchName,
    branchManager: dto.branchManager,
    branchContact: dto.branchContact,
    branchAddress: dto.branchAddress,
    // The API returns a full ISO timestamp; the mobile UI only displays the
    // order's calendar date.
    orderDate: dto.orderDate.slice(0, 10),
    items: dto.items.map((item) => ({
      productId: item.productId ?? "",
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

function buildListQuery(
  branchId: string,
  page: number,
  pageSize: number,
): string {
  const params: string[] = [];
  const add = (key: string, value: string | number) => {
    if (value === "") return;
    params.push(`${key}=${encodeURIComponent(String(value))}`);
  };

  add("page", page);
  add("pageSize", pageSize);
  add("branchId", branchId);
  add("sortBy", "createdAt");
  add("sortOrder", "desc");

  return params.length > 0 ? `?${params.join("&")}` : "";
}

async function fetchAllPages(branchId: string): Promise<BranchOrder[]> {
  const orders: BranchOrder[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await request<ApiBranchOrderList>(
      `/branch-orders${buildListQuery(branchId, page, LIST_PAGE_SIZE)}`,
    );
    orders.push(...result.branchOrders.map(toBranchOrder));
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);

  return orders;
}

export interface CreateBranchOrderInput {
  branchId: string;
  items: BranchOrderItem[];
  notes?: string;
}

/**
 * Loads every branch order page visible to the signed-in branch account.
 *
 * The API already scopes branch users to their own branch, but we keep the
 * `branchId` filter so the same helper is safe for admin-style callers.
 */
export async function listOrdersForBranch(
  branchId: string,
): Promise<BranchOrder[]> {
  return fetchAllPages(branchId);
}

export async function getOrderForBranch(
  id: string,
  branchId: string,
): Promise<BranchOrder | null> {
  try {
    const { branchOrder } = await request<ApiBranchOrderResponse>(
      `/branch-orders/${encodeURIComponent(id)}`,
    );
    const order = toBranchOrder(branchOrder);
    if (branchId && order.branchId !== branchId) return null;
    return order;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createBranchOrder(
  input: CreateBranchOrderInput,
): Promise<BranchOrder> {
  const { branchOrder } = await request<ApiBranchOrderResponse>(
    "/branch-orders",
    {
      method: "POST",
      body: {
        // The backend resolves this from the session for branch accounts, but
        // sending it keeps the request explicit and works for admin callers.
        ...(input.branchId ? { branchId: input.branchId } : {}),
        items: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
      },
    },
  );

  return toBranchOrder(branchOrder);
}

export function summarizeOrderItems(items: BranchOrderItem[]) {
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
  return { totalQuantity, subtotal, totalAmount: subtotal };
}

export function buildBranchOrderItem(
  product: Product,
  quantity: number,
): BranchOrderItem {
  const subtotal = product.sellingPrice * quantity;
  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    quantity,
    unitPrice: product.sellingPrice,
    subtotal,
  };
}
