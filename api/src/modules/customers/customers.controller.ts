import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as customersService from "./customers.service.js";
import type {
  CreateCustomerDto,
  ListCustomersQueryDto,
  UpdateCustomerDto,
} from "./dto/index.js";

type CustomersRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

function isAdmin(user: AuthenticatedRequest["user"]): boolean {
  return user.role === "ADMIN" || user.role === "SUPER_ADMIN";
}

export const listCustomersController = asyncHandler(
  async (req: CustomersRequest, res) => {
    const query = req.query as unknown as ListCustomersQueryDto;
    const result = isAdmin(req.user)
      ? await customersService.listAllCustomers(query)
      : await customersService.listCustomers(req.user.id, query);
    return sendSuccess(res, result);
  },
);

export const getCustomerController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const customer = isAdmin(req.user)
      ? await customersService.getCustomerByIdAsAdmin(req.params.id)
      : await customersService.getCustomerById(req.user.id, req.params.id);
    return sendSuccess(res, { customer });
  },
);

export const createCustomerController = asyncHandler(
  async (req: CustomersRequest<CreateCustomerDto>, res) => {
    const customer = isAdmin(req.user)
      ? await customersService.createCustomerAsAdmin(req.body)
      : await customersService.createCustomer(
          req.user.id,
          req.user.name,
          req.body,
        );
    return sendSuccess(res, { customer }, 201);
  },
);

export const updateCustomerController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateCustomerDto>,
    res,
  ) => {
    const customer = isAdmin(req.user)
      ? await customersService.updateCustomerAsAdmin(req.params.id, req.body)
      : await customersService.updateCustomer(
          req.user.id,
          req.params.id,
          req.body,
        );
    return sendSuccess(res, { customer });
  },
);
