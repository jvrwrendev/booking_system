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
