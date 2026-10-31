/**
 * Wire types for the Agrivet booking API.
 *
 * These mirror the API exactly (`api/src/lib/api-response.ts`,
 * `api/src/lib/user-select.ts`, `api/src/modules/*`). Domain types used by
 * the UI live in `src/types/*`; never import this file into a component.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type AccountStatusDto = "ACTIVE" | "INACTIVE" | "SUSPENDED";
export type RoleDto = "SUPER_ADMIN" | "ADMIN";

/** `api/src/lib/user-select.ts` — `PUBLIC_USER_SELECT`. */
export interface PublicUserDto {
  id: string;
  name: string;
  email: string;
  role: RoleDto;
  status: AccountStatusDto;
  /** JSON date string. */
  createdAt: string;
  /** JSON date string. */
  updatedAt: string;
}

export interface SessionDto {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
}

/** `api/src/modules/users/users.types.ts` — `ListUsersResult`. */
export interface ListUsersResponseDto {
  users: PublicUserDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** `api/src/modules/auth/auth.controller.ts:39` — login response body. */
export interface LoginResponseDto {
  user: PublicUserDto;
  session: SessionDto;
}

export interface CreateUserPayloadDto {
  name: string;
  email: string;
  password: string;
  role: RoleDto;
  status: AccountStatusDto;
}

export type UpdateUserPayloadDto = Partial<{
  name: string;
  email: string;
  role: RoleDto;
  status: AccountStatusDto;
}>;

export interface ChangePasswordPayloadDto {
  currentPassword: string;
  newPassword: string;
}

/* ------------------------------------------------------------------ */
/* Catalog and inventory wire types                                    */
/* ------------------------------------------------------------------ */

export type CategoryStatusDto = "ACTIVE" | "INACTIVE";
export type ProductStatusDto = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
export type StockStatusDto =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "CRITICAL"
  | "OUT_OF_STOCK";
export type InventoryTransactionTypeDto =
  | "STOCK_IN"
  | "STOCK_OUT"
  | "ADJUSTMENT"
  | "TRANSFER"
  | "RESERVATION"
  | "RELEASE"
  | "ORDER_COMMIT"
  | "ORDER_RELEASE";

export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  status: CategoryStatusDto;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListCategoriesResponseDto {
  categories: CategoryDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCategoryPayloadDto {
  name: string;
  description?: string;
  status: CategoryStatusDto;
}

export type UpdateCategoryPayloadDto = Partial<CreateCategoryPayloadDto>;

export type SupplierStatusDto = "ACTIVE" | "INACTIVE";

export interface SupplierDto {
  id: string;
  name: string;
  contactName: string | null;
  contactNumber: string | null;
  address: string | null;
  status: SupplierStatusDto;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListSuppliersResponseDto {
  suppliers: SupplierDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateSupplierPayloadDto {
  name: string;
  contactName?: string;
  contactNumber?: string;
  address?: string;
  status: SupplierStatusDto;
}

export type UpdateSupplierPayloadDto = Partial<CreateSupplierPayloadDto>;

export interface ProductDto {
  id: string;
  name: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  supplierId: string | null;
  supplierName: string | null;
  brand: string | null;
  description: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  supplier: string | null;
  status: ProductStatusDto;
  stockStatus: StockStatusDto;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListProductsResponseDto {
  products: ProductDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateProductPayloadDto {
  name: string;
  sku: string;
  categoryId?: string | null;
  supplierId?: string | null;
  brand?: string;
  description?: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minimumStockLevel: number;
  supplier?: string;
  status: ProductStatusDto;
  image?: string | null;
  reason?: string;
}

export type UpdateProductPayloadDto = Partial<CreateProductPayloadDto>;

export interface InventoryItemDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryId: string | null;
  categoryName: string;
  branchId: string;
  branchName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  status: StockStatusDto;
  updatedAt: string;
}

export interface ListInventoryResponseDto {
  items: InventoryItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InventoryTransactionDto {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  branchId: string;
  branchName: string;
  type: InventoryTransactionTypeDto;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  referenceType: string | null;
  referenceId: string | null;
  date: string;
}

export interface ListInventoryTransactionsResponseDto {
  transactions: InventoryTransactionDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface InventorySummaryDto {
  totalProducts: number;
  totalUnits: number;
  inventoryValue: number;
  lowStockCount: number;
  criticalCount: number;
  outOfStockCount: number;
  alerts: InventoryItemDto[];
}

export interface InventoryBranchDto {
  id: string;
  name: string;
  code: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface StockMovementPayloadDto {
  productId: string;
  branchId?: string;
  quantity: number;
  reason?: string;
}

export interface TransferStockPayloadDto {
  productId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  reason?: string;
}

export interface OrderStockItemDto {
  productId?: string;
  sku?: string;
  productName?: string;
  quantity: number;
}

export interface OrderStockPayloadDto {
  branchId?: string;
  items: OrderStockItemDto[];
}

/* ------------------------------------------------------------------ */
/* Booking wire types                                                  */
/* ------------------------------------------------------------------ */

export type BookingStatusDto =
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED"
  | "ADMIN_ACCEPTED"
  | "REVIEW_ORDER"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "READY_FOR_DELIVERY"
  | "CANCELLED"
  | "REJECTED";

export interface BookingItemDto {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BookingStatusHistoryDto {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: string;
  by: string;
}

export interface BookingDto {
  id: string;
  reference: string;
  customerId: string | null;
  customerName: string;
  customerContact: string | null;
  customerAddress: string | null;
  agentId: string | null;
  agentName: string;
  branchId: string;
  branchName: string;
  bookingDate: string;
  pickupDate: string;
  items: BookingItemDto[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BookingStatusDto;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignmentDate: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: BookingStatusHistoryDto[];
}

export interface ListBookingsResponseDto {
  bookings: BookingDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BookingItemPayloadDto {
  productId: string;
  quantity: number;
}

export interface CreateBookingPayloadDto {
  customerId?: string;
  customerName: string;
  customerContact?: string;
  customerAddress?: string;
  agentId?: string;
  agentName: string;
  branchId: string;
  bookingDate: string;
  pickupDate: string;
  items: BookingItemPayloadDto[];
  discount?: number;
  notes?: string;
}

export type UpdateBookingPayloadDto = Partial<CreateBookingPayloadDto>;

export interface AssignBookingPayloadDto {
  adminId: string;
  note?: string;
}

export interface ApplyBookingDiscountPayloadDto {
  discount: number;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Branch order wire types                                             */
/* ------------------------------------------------------------------ */

export type BranchOrderStatusDto =
  | "PENDING"
  | "ACCEPTED"
  | "ASSIGNED"
  | "ADMIN_ACCEPTED"
  | "REVIEW_ORDER"
  | "PROCESSING"
  | "READY"
  | "COMPLETED"
  | "READY_FOR_DELIVERY"
  | "REJECTED";

export interface BranchOrderItemDto {
  id: string;
  productId: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BranchOrderStatusHistoryDto {
  id: string;
  from: string;
  to: string;
  label: string;
  timestamp: string;
  by: string;
}

export interface BranchOrderDto {
  id: string;
  reference: string;
  branchId: string;
  branchName: string;
  branchManager: string | null;
  branchContact: string | null;
  branchAddress: string | null;
  orderDate: string;
  items: BranchOrderItemDto[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  totalAmount: number;
  status: BranchOrderStatusDto;
  notes: string | null;
  assignedAdminId: string | null;
  assignedAdminName: string | null;
  assignedById: string | null;
  assignedByName: string | null;
  assignmentDate: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: BranchOrderStatusHistoryDto[];
}

export interface ListBranchOrdersResponseDto {
  branchOrders: BranchOrderDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BranchOrderItemPayloadDto {
  productId: string;
  quantity: number;
}

export interface CreateBranchOrderPayloadDto {
  branchId?: string;
  orderDate?: string;
  items: BranchOrderItemPayloadDto[];
  discount?: number;
  notes?: string;
}

export type UpdateBranchOrderPayloadDto = Partial<CreateBranchOrderPayloadDto>;

export interface AssignBranchOrderPayloadDto {
  adminId: string;
  note?: string;
}

export interface ApplyBranchOrderDiscountPayloadDto {
  discount: number;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Reports wire types                                                  */
/* ------------------------------------------------------------------ */

export interface ReportsBundleDto {
  generatedAt: string;
  filters: {
    dateFrom: string;
    dateTo: string;
    branchId: string | null;
    agentId: string | null;
    status: BookingStatusDto | null;
    categoryId: string | null;
  };
  summary: {
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    uniqueCustomers: number;
  };
  bookingVolumeMonthly: { month: string; count: number }[];
  bookingRevenueMonthly: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  inventoryByCategory: { category: string; value: number }[];
  branchPerformance: {
    branch: string;
    bookings: number;
    completed: number;
    revenue: number;
  }[];
  agentPerformance: {
    agent: string;
    bookings: number;
    completed: number;
    revenue: number;
  }[];
  lowStockProducts: {
    name: string;
    sku: string;
    stock: number;
    minimum: number;
  }[];
}

export type ReportExportFormat = "csv" | "excel" | "pdf";
export type ReportSection = "all" | "bookings" | "inventory" | "branches" | "agents";
