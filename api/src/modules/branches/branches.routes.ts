import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  createBranchController,
  getBranchController,
  listBranchesController,
  updateBranchController,
  updateBranchStatusController,
} from "./branches.controller.js";
import {
  branchParamsDto,
  createBranchDto,
  listBranchesQueryDto,
  updateBranchDto,
  updateBranchStatusDto,
} from "./dto/index.js";

export const branchesRouter = Router();

branchesRouter.use(requireRole("ADMIN"));

branchesRouter.get(
  "/",
  validateQuery(listBranchesQueryDto),
  listBranchesController,
);

branchesRouter.get(
  "/:id",
  validateParams(branchParamsDto),
  getBranchController,
);

branchesRouter.post("/", validateBody(createBranchDto), createBranchController);

branchesRouter.patch(
  "/:id",
  validateParams(branchParamsDto),
  validateBody(updateBranchDto),
  updateBranchController,
);

branchesRouter.patch(
  "/:id/status",
  validateParams(branchParamsDto),
  validateBody(updateBranchStatusDto),
  updateBranchStatusController,
);
