import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as productsService from "./products.service.js";
import type {
  CreateProductDto,
  ListProductsQueryDto,
  UpdateProductDto,
} from "./dto/index.js";

function actor(req: AuthenticatedRequest) {
  return { id: req.user.id, name: req.user.name };
}

type ProductsRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listProductsController = asyncHandler(
  async (req: ProductsRequest, res) => {
    const query = req.query as unknown as ListProductsQueryDto;
    const result = await productsService.listProducts(query);
    return sendSuccess(res, result);
  },
);

export const getProductController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const product = await productsService.getProductById(req.params.id);
    return sendSuccess(res, { product });
  },
);

export const createProductController = asyncHandler(
  async (req: ProductsRequest<CreateProductDto>, res) => {
    const product = await productsService.createProduct(req.body, actor(req));
    return sendSuccess(res, { product }, 201);
  },
);

export const updateProductController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }, unknown, UpdateProductDto>, res) => {
    const product = await productsService.updateProduct(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { product });
  },
);

export const deleteProductController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await productsService.deleteProduct(req.params.id);
    return sendSuccess(res, { message: "Product deleted successfully" });
  },
);
