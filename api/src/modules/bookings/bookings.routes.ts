import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation.middleware.js";
import {
  applyBookingDiscountController,
  assignBookingController,
  createBookingController,
  deleteBookingController,
  getBookingController,
  listBookingsController,
  unassignBookingController,
  updateBookingController,
  updateBookingStatusController,
} from "./bookings.controller.js";
import {
  applyBookingDiscountDto,
  assignBookingDto,
  bookingParamsDto,
  createBookingDto,
  listBookingsQueryDto,
  updateBookingDto,
  updateBookingStatusDto,
} from "./dto/index.js";

export const bookingsRouter = Router();

bookingsRouter.use(requireRole("ADMIN", "AGENT"));

bookingsRouter.get(
  "/",
  validateQuery(listBookingsQueryDto),
  listBookingsController,
);

bookingsRouter.get(
  "/:id",
  validateParams(bookingParamsDto),
  getBookingController,
);

bookingsRouter.post(
  "/",
  validateBody(createBookingDto),
  createBookingController,
);

bookingsRouter.patch(
  "/:id",
  requireRole("ADMIN"),
  validateParams(bookingParamsDto),
  validateBody(updateBookingDto),
  updateBookingController,
);

bookingsRouter.delete(
  "/:id",
  requireRole("ADMIN"),
  validateParams(bookingParamsDto),
  deleteBookingController,
);

bookingsRouter.patch(
  "/:id/status",
  validateParams(bookingParamsDto),
  validateBody(updateBookingStatusDto),
  updateBookingStatusController,
);

bookingsRouter.patch(
  "/:id/assign",
  requireRole("ADMIN"),
  validateParams(bookingParamsDto),
  validateBody(assignBookingDto),
  assignBookingController,
);

bookingsRouter.delete(
  "/:id/assignment",
  requireRole("ADMIN"),
  validateParams(bookingParamsDto),
  unassignBookingController,
);

bookingsRouter.patch(
  "/:id/discount",
  requireRole("ADMIN"),
  validateParams(bookingParamsDto),
  validateBody(applyBookingDiscountDto),
  applyBookingDiscountController,
);
