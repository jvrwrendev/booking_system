import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as branchesService from "./branches.service.js";
import type {
  CreateBranchDto,
  ListBranchesQueryDto,
  UpdateBranchDto,
  UpdateBranchStatusDto,
} from "./dto/index.js";

type BranchesRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listBranchesController = asyncHandler(
  async (req: BranchesRequest, res) => {
    const query = req.query as unknown as ListBranchesQueryDto;
    const result = await branchesService.listBranches(query);
    return sendSuccess(res, result);
  },
);

export const getBranchController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const branch = await branchesService.getBranchById(req.params.id);
    return sendSuccess(res, { branch });
  },
);

export const createBranchController = asyncHandler(
  async (req: BranchesRequest<CreateBranchDto>, res) => {
    const branch = await branchesService.createBranch(req.body);
    return sendSuccess(res, { branch }, 201);
  },
);

export const updateBranchController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateBranchDto>,
    res,
  ) => {
    const branch = await branchesService.updateBranch(req.params.id, req.body);
    return sendSuccess(res, { branch });
  },
);

export const updateBranchStatusController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateBranchStatusDto>,
    res,
  ) => {
    const branch = await branchesService.updateBranchStatus(
      req.params.id,
      req.body.status,
    );
    return sendSuccess(res, { branch });
  },
);
