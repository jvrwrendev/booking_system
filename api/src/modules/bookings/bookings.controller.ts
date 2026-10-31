import { asyncHandler } from "../../lib/async-handler.js";
import { sendSuccess } from "../../lib/api-response.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import * as bookingsService from "./bookings.service.js";
import type {
  ApplyBookingDiscountDto,
  AssignBookingDto,
  CreateBookingDto,
  ListBookingsQueryDto,
  UpdateBookingDto,
  UpdateBookingStatusDto,
} from "./dto/index.js";

function actor(req: AuthenticatedRequest) {
  return {
    id: req.user.id,
    name: req.user.name,
    role: req.user.role,
    branchId: req.user.branchId,
  };
}

type BookingsRequest<T = unknown> = AuthenticatedRequest<
  Record<string, string>,
  unknown,
  T
>;

export const listBookingsController = asyncHandler(
  async (req: BookingsRequest, res) => {
    const query = req.query as unknown as ListBookingsQueryDto;
    const result = await bookingsService.listBookings(query, actor(req));
    return sendSuccess(res, result);
  },
);

export const getBookingController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const booking = await bookingsService.getBookingById(req.params.id);
    return sendSuccess(res, { booking });
  },
);

export const createBookingController = asyncHandler(
  async (req: BookingsRequest<CreateBookingDto>, res) => {
    const booking = await bookingsService.createBooking(req.body, actor(req));
    return sendSuccess(res, { booking }, 201);
  },
);

export const updateBookingController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, UpdateBookingDto>,
    res,
  ) => {
    const booking = await bookingsService.updateBooking(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { booking });
  },
);

export const deleteBookingController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    await bookingsService.deleteBooking(req.params.id);
    return sendSuccess(res, { message: "Booking deleted successfully" });
  },
);

export const updateBookingStatusController = asyncHandler(
  async (
    req: AuthenticatedRequest<
      { id: string },
      unknown,
      UpdateBookingStatusDto
    >,
    res,
  ) => {
    const booking = await bookingsService.updateBookingStatus(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { booking });
  },
);

export const assignBookingController = asyncHandler(
  async (
    req: AuthenticatedRequest<{ id: string }, unknown, AssignBookingDto>,
    res,
  ) => {
    const booking = await bookingsService.assignBooking(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { booking });
  },
);

export const unassignBookingController = asyncHandler(
  async (req: AuthenticatedRequest<{ id: string }>, res) => {
    const booking = await bookingsService.unassignBooking(
      req.params.id,
      actor(req),
    );
    return sendSuccess(res, { booking });
  },
);

export const applyBookingDiscountController = asyncHandler(
  async (
    req: AuthenticatedRequest<
      { id: string },
      unknown,
      ApplyBookingDiscountDto
    >,
    res,
  ) => {
    const booking = await bookingsService.applyBookingDiscount(
      req.params.id,
      req.body,
      actor(req),
    );
    return sendSuccess(res, { booking });
  },
);
