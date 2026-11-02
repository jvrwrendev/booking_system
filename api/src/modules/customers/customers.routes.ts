import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  createCustomerController,
  getCustomerController,
  listCustomersController,
  updateCustomerController,
} from "./customers.controller.js";
import {
  createCustomerDto,
  customerParamsDto,
  listCustomersQueryDto,
  updateCustomerDto,
} from "./dto/index.js";

export const customersRouter = Router();

// Agents manage only their own customers. Administrators can manage every
// customer and assign records to an agent.
customersRouter.use(requireRole("ADMIN", "AGENT"));

customersRouter.get(
  "/",
  validateQuery(listCustomersQueryDto),
  listCustomersController,
);

customersRouter.get(
  "/:id",
  validateParams(customerParamsDto),
  getCustomerController,
);

customersRouter.post(
  "/",
  validateBody(createCustomerDto),
  createCustomerController,
);

customersRouter.patch(
  "/:id",
  validateParams(customerParamsDto),
  validateBody(updateCustomerDto),
  updateCustomerController,
);
