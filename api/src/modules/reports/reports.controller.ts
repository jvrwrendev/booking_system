import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as reportsService from "./reports.service.js";
import type {
  ReportExportQueryDto,
  ReportsQueryDto,
} from "./dto/index.js";

type ReportsRequest = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  unknown,
  Record<string, string | string[] | undefined>
>;

export const getReportsController = asyncHandler(
  async (req: ReportsRequest, res) => {
    const query = req.query as unknown as ReportsQueryDto;
    const report = await reportsService.generateReports(query);
    return sendSuccess(res, report);
  },
);

export const exportReportsController = asyncHandler(
  async (req: ReportsRequest, res) => {
    const query = req.query as unknown as ReportExportQueryDto;
    const file = await reportsService.generateReportExport(query);
    res.setHeader("Content-Type", file.contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`,
    );
    return res.status(200).send(file.body);
  },
);
