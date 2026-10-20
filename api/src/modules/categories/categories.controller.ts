import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as categoriesService from "./categories.service.js";
import type {
  CreateCategoryDto,
  ListCategoriesQueryDto,
  UpdateCategoryDto,
} from "./dto/index.js";

type CategoriesRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listCategoriesController = asyncHandler(
  async (req: CategoriesRequest, res) => {
    const query = req.query as unknown as ListCategoriesQueryDto;
    const result = await categoriesService.listCategories(query);
    return sendSuccess(res, result);
  },
);

export const getCategoryController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const category = await categoriesService.getCategoryById(req.params.id);
    return sendSuccess(res, { category });
  },
);

export const createCategoryController = asyncHandler(
  async (req: CategoriesRequest<CreateCategoryDto>, res) => {
    const category = await categoriesService.createCategory(req.body);
    return sendSuccess(res, { category }, 201);
  },
);

export const updateCategoryController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateCategoryDto>, res) => {
    const category = await categoriesService.updateCategory(
      req.params.id,
      req.body,
    );
    return sendSuccess(res, { category });
  },
);

export const deleteCategoryController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await categoriesService.deleteCategory(req.params.id);
    return sendSuccess(res, { message: "Category deleted successfully" });
  },
);
