import { z } from "zod";

export const BOOKING_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "ASSIGNED",
  "ADMIN_ACCEPTED",
  "REVIEW_ORDER",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "READY_FOR_DELIVERY",
  "CANCELLED",
  "REJECTED",
] as const;

export const bookingParamsDto = z.object({
  id: z.string().trim().min(1, "Booking id is required").max(100),
});

const bookingFilterShape = {
  search: z.string().trim().max(255).optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  branchId: z.string().trim().max(100).optional(),
  agentId: z.string().trim().max(100).optional(),
  assignedAdminId: z.string().trim().max(100).optional(),
  assignment: z.enum(["assigned", "unassigned"]).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

export const bookingFiltersDto = z.object(bookingFilterShape);

export const listBookingsQueryDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  ...bookingFilterShape,
  sortBy: z
    .enum([
      "reference",
      "customerName",
      "agentName",
      "branchName",
      "bookingDate",
      "pickupDate",
      "totalAmount",
      "status",
      "createdAt",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const bookingItemDto = z.object({
  productId: z.string().trim().min(1, "Product is required").max(100),
  quantity: z.coerce.number().int().positive("Quantity must be greater than zero").max(9_999_999),
});

export const createBookingDto = z
  .object({
    customerId: z.string().trim().max(100).optional(),
    customerName: z.string().trim().min(1, "Customer name is required").max(255),
    customerContact: z.string().trim().max(100).optional(),
    customerAddress: z.string().trim().max(1000).optional(),
    agentId: z.string().trim().max(100).optional(),
    agentName: z.string().trim().min(1, "Agent name is required").max(255),
    branchId: z.string().trim().min(1, "Branch is required").max(100),
    bookingDate: z.coerce.date(),
    pickupDate: z.coerce.date(),
    items: z.array(bookingItemDto).min(1, "At least one item is required"),
    discount: z.coerce.number().min(0).max(99_999_999).default(0),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.pickupDate >= data.bookingDate, {
    message: "Pickup date cannot be before the booking date",
    path: ["pickupDate"],
  });

export const updateBookingDto = z
  .object({
    customerId: z.string().trim().max(100).nullable().optional(),
    customerName: z.string().trim().min(1).max(255).optional(),
    customerContact: z.string().trim().max(100).nullable().optional(),
    customerAddress: z.string().trim().max(1000).nullable().optional(),
    agentId: z.string().trim().max(100).nullable().optional(),
    agentName: z.string().trim().min(1).max(255).optional(),
    branchId: z.string().trim().min(1).max(100).optional(),
    bookingDate: z.coerce.date().optional(),
    pickupDate: z.coerce.date().optional(),
    items: z.array(bookingItemDto).min(1).optional(),
    discount: z.coerce.number().min(0).max(99_999_999).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(
    (data) =>
      data.bookingDate === undefined ||
      data.pickupDate === undefined ||
      data.pickupDate >= data.bookingDate,
    {
      message: "Pickup date cannot be before the booking date",
      path: ["pickupDate"],
    },
  );

export const updateBookingStatusDto = z.object({
  status: z.enum(BOOKING_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export const assignBookingDto = z.object({
  adminId: z.string().trim().min(1, "Admin is required").max(100),
  note: z.string().trim().max(500).optional(),
});

export const applyBookingDiscountDto = z.object({
  discount: z.coerce.number().min(0).max(99_999_999),
  note: z.string().trim().max(500).optional(),
});

export type BookingParamsDto = z.infer<typeof bookingParamsDto>;
export type BookingFiltersDto = z.infer<typeof bookingFiltersDto>;
export type ListBookingsQueryDto = z.infer<typeof listBookingsQueryDto>;
export type CreateBookingDto = z.infer<typeof createBookingDto>;
export type UpdateBookingDto = z.infer<typeof updateBookingDto>;
export type UpdateBookingStatusDto = z.infer<typeof updateBookingStatusDto>;
export type AssignBookingDto = z.infer<typeof assignBookingDto>;
export type ApplyBookingDiscountDto = z.infer<typeof applyBookingDiscountDto>;
