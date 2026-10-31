import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as branchOrdersService from "./branch-orders.service.js";
import type {
  ApplyBranchOrderDiscountDto,
  AssignBranchOrderDto,
  CreateBranchOrderDto,
  ListBranchOrdersQueryDto,
  UpdateBranchOrderDto,
  UpdateBranchOrderStatusDto,
} from "./dto/index.js";

function actor(req: AuthenticatedRequest) {
  return {
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    branchId: req.user.branchId,
  };
}

type BranchOrdersRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listBranchOrdersController = asyncHandler(
  async (req: BranchOrdersRequest, res) => {
    const query = req.query as unknown as ListBranchOrdersQueryDto;
    const result = await branchOrdersService.listBranchOrders(query, actor(req));
    return sendSuccess(res, result);
  },
);

export const getBranchOrderController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const branchOrder = await branchOrdersService.getBranchOrderById(
      req.params.id,
      actor(req),
    );
    return sendSuccess(res, { branchOrder });
  },
);

export const createBranchOrderController = asyncHandler(
  async (req: BranchOrdersRequest<CreateBranchOrderDto>, res) => {
    const branchOrder = await branchOrdersService.createBranchOrder(
      req.body,
      actor(req),
    );
    return sendSuccess(res, { branchOrder }, 201);
  },
);

export const updateBranchOrderController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateBranchOrderDto>,
    res,
  ) => {
    const branchOrder = await branchOrdersService.updateBranchOrder(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { branchOrder });
  },
);

export const deleteBranchOrderController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await branchOrdersService.deleteBranchOrder(req.params.id, actor(req));
    return sendSuccess(res, {
      message: "Branch order deleted successfully",
    });
  },
);

export const updateBranchOrderStatusController = asyncHandler(
  async (
    req: AuthenticatedRequest<
      { id: string },
      unknown,
      UpdateBranchOrderStatusDto
    >,
    res,
  ) => {
    const branchOrder = await branchOrdersService.updateBranchOrderStatus(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { branchOrder });
  },
);

export const assignBranchOrderController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, AssignBranchOrderDto>,
    res,
  ) => {
    const branchOrder = await branchOrdersService.assignBranchOrder(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { branchOrder });
  },
);

export const unassignBranchOrderController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const branchOrder = await branchOrdersService.unassignBranchOrder(
      req.params.id,
      actor(req),
    );
    return sendSuccess(res, { branchOrder });
  },
);

export const applyBranchOrderDiscountController = asyncHandler(
  async (
    req: AuthenticatedRequest<
      { id: string },
      unknown,
      ApplyBranchOrderDiscountDto
    >,
    res,
  ) => {
    const branchOrder = await branchOrdersService.applyBranchOrderDiscount(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { branchOrder });
  },
);
