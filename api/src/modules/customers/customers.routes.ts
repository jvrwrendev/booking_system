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

// Customers are owned by the authenticated agent. Administrators do not use
// this module; they continue to rely on booking-level customer snapshots.
customersRouter.use(requireRole("AGENT"));

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
