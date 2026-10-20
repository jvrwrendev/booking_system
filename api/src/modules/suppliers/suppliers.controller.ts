import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as suppliersService from "./suppliers.service.js";
import type {
  CreateSupplierDto,
  ListSuppliersQueryDto,
  UpdateSupplierDto,
} from "./dto/index.js";

type SuppliersRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listSuppliersController = asyncHandler(
  async (req: SuppliersRequest, res) => {
    const query = req.query as unknown as ListSuppliersQueryDto;
    const result = await suppliersService.listSuppliers(query);
    return sendSuccess(res, result);
  },
);

export const getSupplierController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const supplier = await suppliersService.getSupplierById(req.params.id);
    return sendSuccess(res, { supplier });
  },
);

export const createSupplierController = asyncHandler(
  async (req: SuppliersRequest<CreateSupplierDto>, res) => {
    const supplier = await suppliersService.createSupplier(req.body);
    return sendSuccess(res, { supplier }, 201);
  },
);

export const updateSupplierController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateSupplierDto>, res) => {
    const supplier = await suppliersService.updateSupplier(
      req.params.id,
      req.body,
    );
    return sendSuccess(res, { supplier });
  },
);

export const deleteSupplierController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await suppliersService.deleteSupplier(req.params.id);
    return sendSuccess(res, { message: "Supplier deleted successfully" });
  },
);
