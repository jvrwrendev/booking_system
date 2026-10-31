import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import { validateQuery } from "../../middleware/validation.middleware.js";
import {
  exportReportsController,
  getReportsController,
} from "./reports.controller.js";
import {
  reportExportQueryDto,
  reportsQueryDto,
} from "./dto/index.js";

export const reportsRouter = Router();

reportsRouter.use(requireRole("ADMIN"));

reportsRouter.get(
  "/",
  validateQuery(reportsQueryDto),
  getReportsController,
);

reportsRouter.get(
  "/export",
  validateQuery(reportExportQueryDto),
  exportReportsController,
);
