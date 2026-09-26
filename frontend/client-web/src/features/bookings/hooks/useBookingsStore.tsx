import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockBookings } from "@/data/mock-bookings";
import type { AuthUser } from "@/types/auth";
import type { Booking, BookingItem, BookingStatus } from "@/types/booking";
import { isReleasingStatus } from "@/types/booking";
import type { StatusHistoryEntry } from "@/types/order-history";
import { humanize } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/utils";
import { useProductsStore } from "@/features/products/hooks/useProductsStore";

/**
 * Bumped to v4 when the product catalog was replaced. Bookings saved under v3
 * reference product IDs that now point at different products, so keeping them
 * would deduct or restore stock against the wrong items.
 */
const STORAGE_KEY = "agrivet-bookings-v4";

/** A booking as submitted by a client, before the store assigns identity and totals. */
export interface NewBooking {
  customerId: string;
  customerName: string;
  agentId: string;
  agentName: string;
  branchId: string;
  branchName: string;
  bookingDate: string;
  pickupDate: string;
  items: BookingItem[];
  discount?: number;
  notes?: string;
}

export type AddBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string };

/** The status at which ordered stock leaves the catalog. */
const COMMIT_STATUS: BookingStatus = "admin_accepted";

/**
 * Statuses where the goods have already left the store. Releasing stock from
 * these would hand back units that were physically delivered, so the transition
 * is refused. They are still allowed to move forward (`completed` to
 * `ready_for_delivery`), which is why this is checked against the *target*
 * status rather than treated as a general terminal guard.
 */
const FULFILLED_STATUSES: BookingStatus[] = ["completed", "ready_for_delivery"];

function historyEntry(
  from: string,
  to: string,
  by?: Pick<AuthUser, "id" | "fullName">,
  label?: string
): StatusHistoryEntry {
  return {
    id: `h-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    label: label ?? humanize(to),
    timestamp: new Date().toISOString(),
    by: by?.fullName ?? "System",
  };
}

interface BookingsContextValue {
  bookings: Booking[];
  getBooking: (id: string) => Booking | undefined;
  addBooking: (draft: NewBooking) => AddBookingResult;
  setStatus: (
    id: string,
    status: BookingStatus,
    by?: Pick<AuthUser, "id" | "fullName">
  ) => { ok: boolean; error?: string };
  assignBooking: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">
  ) => void;
  reassignBooking: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">
  ) => void;
  unassignBooking: (id: string) => void;
  applyDiscount: (
    id: string,
    discount: number,
    by?: Pick<AuthUser, "id" | "fullName">,
    note?: string
  ) => void;
}

function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Booking[];
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return mockBookings;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(loadBookings);
  const { deductStock, restoreStock } = useProductsStore();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      // Ignore quota/availability errors; state remains in-memory.
    }
  }, [bookings]);

  // Stock decisions need the freshest booking list, not the one captured when
  // the callback was created, so the lifecycle never reads a stale snapshot.
  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;

  const nextIdRef = useRef<number | null>(null);
  const allocateReference = useCallback(() => {
    const year = new Date().getFullYear();
    const prefix = `BK-${year}-`;
    if (nextIdRef.current === null) {
      // References from earlier years are not comparable, so the high-water mark
      // only considers the current year's prefix.
      nextIdRef.current = bookingsRef.current
        .map((b) => Number(b.reference.replace(prefix, "")))
        .filter((n) => !Number.isNaN(n))
        .reduce((acc, n) => Math.max(acc, n), 0);
    }
    nextIdRef.current += 1;
    return `${prefix}${String(nextIdRef.current).padStart(5, "0")}`;
  }, []);

  const addBooking = useCallback(
    (draft: NewBooking): AddBookingResult => {
      if (draft.items.length === 0) {
        return { ok: false, error: "Add at least one product to the booking." };
      }

      // A zero or negative line would be committed and restored with inverted
      // signs, so a later cancellation would add stock that was never removed.
      const badItem = draft.items.find(
        (item) => !Number.isFinite(item.quantity) || item.quantity <= 0
      );
      if (badItem) {
        return {
          ok: false,
          error: `"${badItem.productName}" has an invalid quantity (${badItem.quantity}). Quantities must be greater than zero.`,
        };
      }

      // Money is guarded at the same boundary: a non-finite price or discount
      // would render as "NaN" everywhere, and a negative one would inflate the
      // total above the subtotal.
      const badPrice = draft.items.find(
        (item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0
      );
      if (badPrice) {
        return {
          ok: false,
          error: `"${badPrice.productName}" has an invalid unit price.`,
        };
      }
      const discount = draft.discount ?? 0;
      if (!Number.isFinite(discount) || discount < 0) {
        return {
          ok: false,
          error: "Discount must be a number of 0 or greater.",
        };
      }

      // Totals are derived here rather than trusted from the caller, so the
      // stored amounts always match the stored line items.
      const items = draft.items.map((item) => ({
        ...item,
        subtotal: item.unitPrice * item.quantity,
      }));
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
      const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      // Finite unit prices can still overflow when multiplied out, which would
      // store Infinity and render as such on every booking surface.
      if (!Number.isFinite(subtotal)) {
        return {
          ok: false,
          error: "The booking total is too large to calculate.",
        };
      }
      const now = new Date().toISOString();
      const reference = allocateReference();

      const booking: Booking = {
        ...draft,
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        reference,
        items,
        totalQuantity,
        subtotal,
        discount,
        totalAmount: Math.max(0, subtotal - discount),
        status: "pending",
        createdAt: now,
        // Stock is only committed when the booking reaches admin acceptance.
        stockCommitted: false,
        statusHistory: [historyEntry("pending", "pending", undefined, "Created")],
      };

      setBookings((prev) => [booking, ...prev]);
      toast.success("Booking created", {
        description: `${reference} is pending review. Stock is reserved once an admin accepts it.`,
      });
      return { ok: true, booking };
    },
    [allocateReference]
  );

  const setStatus = useCallback(
    (
      id: string,
      status: BookingStatus,
      by?: Pick<AuthUser, "id" | "fullName">
    ): { ok: boolean; error?: string } => {
      const booking = bookingsRef.current.find((b) => b.id === id);
      if (!booking) return { ok: false, error: "Booking not found." };

      if (booking.status === status) return { ok: true };

      // Releasing statuses are terminal. Without this, a rejected booking could
      // be accepted again and deduct its stock a second time.
      if (isReleasingStatus(booking.status)) {
        const error = `This booking is already ${humanize(
          booking.status
        ).toLowerCase()} and cannot be moved to ${humanize(status).toLowerCase()}.`;
        toast.error("Cannot change booking status", { description: error });
        return { ok: false, error };
      }

      // A fulfilled booking has handed the goods over, so returning its stock
      // would add units the store no longer has.
      if (
        isReleasingStatus(status) &&
        FULFILLED_STATUSES.includes(booking.status)
      ) {
        const error = `This booking is already ${humanize(
          booking.status
        ).toLowerCase()}, so its stock has already been delivered and cannot be returned.`;
        toast.error("Cannot change booking status", { description: error });
        return { ok: false, error };
      }

      const lines = booking.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      const shouldCommit =
        status === COMMIT_STATUS && !booking.stockCommitted;
      const shouldRelease =
        isReleasingStatus(status) && !!booking.stockCommitted;

      if (shouldCommit) {
        const result = deductStock(lines);
        if (!result.ok) {
          toast.error("Cannot accept this booking", {
            description: result.error,
          });
          return { ok: false, error: result.error };
        }
      }

      let releaseWarning: string | undefined;
      if (shouldRelease) {
        const released = restoreStock(lines);
        if (!released.ok) {
          // Keep the booking flagged as still holding stock, so the units are
          // never forgotten by a later transition.
          toast.error("Cannot return stock to the catalog", {
            description: released.error,
          });
          return { ok: false, error: released.error };
        }
        releaseWarning = released.warning;
      }

      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status,
                stockCommitted: shouldCommit
                  ? true
                  : shouldRelease
                  ? false
                  : b.stockCommitted,
                statusHistory: [
                  ...(b.statusHistory ?? []),
                  historyEntry(b.status, status, by),
                ],
              }
            : b
        )
      );

      const stockNote = shouldCommit
        ? " Stock has been deducted from the catalog."
        : shouldRelease
        ? " Stock has been returned to the catalog."
        : "";
      toast.success("Booking status updated", {
        description: `Booking marked as ${humanize(status)}.${stockNote}`,
      });
      if (releaseWarning) {
        // The transition succeeded, so this reports a partial return rather than
        // blocking the booking from ever being closed.
        toast.warning("Some stock could not be returned", {
          description: releaseWarning,
        });
      }
      return { ok: true };
    },
    [deductStock, restoreStock]
  );

  const assignBooking = useCallback(
    (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      by: Pick<AuthUser, "id" | "fullName">
    ) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                assignedAdminId: admin.id,
                assignedAdminName: admin.fullName,
                assignedById: by.id,
                assignedByName: by.fullName,
                assignmentDate: new Date().toISOString(),
                status:
                  b.status === "pending" || b.status === "accepted"
                    ? "assigned"
                    : b.status,
                statusHistory: [
                  ...(b.statusHistory ?? []),
                  historyEntry(b.status, "assigned", by),
                ],
              }
            : b
        )
      );
      toast.success("Booking assigned", {
        description: `Booking assigned to ${admin.fullName}.`,
      });
    },
    []
  );

  const reassignBooking = useCallback(
    (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      by: Pick<AuthUser, "id" | "fullName">
    ) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                assignedAdminId: admin.id,
                assignedAdminName: admin.fullName,
                assignedById: by.id,
                assignedByName: by.fullName,
                assignmentDate: new Date().toISOString(),
                statusHistory: [
                  ...(b.statusHistory ?? []),
                  historyEntry("assigned", "assigned", by),
                ],
              }
            : b
        )
      );
      toast.success("Booking reassigned", {
        description: `Booking reassigned to ${admin.fullName}.`,
      });
    },
    []
  );

  const unassignBooking = useCallback((id: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              assignedAdminId: null,
              assignedAdminName: null,
              assignedById: null,
              assignedByName: null,
              assignmentDate: null,
              statusHistory: [
                ...(b.statusHistory ?? []),
                historyEntry("assigned", "assigned", undefined, "Unassigned"),
              ],
            }
          : b
      )
    );
    toast.success("Assignment removed", {
      description: "Booking is now unassigned.",
    });
  }, []);

  const applyDiscount = useCallback(
    (
      id: string,
      discount: number,
      by?: Pick<AuthUser, "id" | "fullName">,
      note?: string
    ) => {
      // Clamped at this boundary so a bad value cannot inflate the total above
      // the subtotal or render as "NaN". The dialog validates too, but the store
      // is the boundary the rest of the app reads from.
      const safe = Number.isFinite(discount) ? Math.max(0, discount) : 0;
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const previous = b.discount ?? 0;
          const removed = safe === 0 && previous > 0;
          return {
            ...b,
            discount: safe,
            totalAmount: Math.max(0, b.subtotal - safe),
            statusHistory: [
              ...(b.statusHistory ?? []),
              historyEntry(
                b.status,
                b.status,
                by,
                removed
                  ? "Discount removed"
                  : `Discount ${note ? `${note}: ` : ""}${formatCurrency(safe)}`
              ),
            ],
          };
        })
      );
      // Reports the clamped value, not the raw argument, so a rejected input
      // cannot render as "NaN" after being stored as 0.
      toast.success("Discount updated", {
        description:
          safe === 0
            ? "Discount removed from the order."
            : `Discount of ${formatCurrency(safe)} applied.`,
      });
    },
    []
  );

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      getBooking: (id) => bookings.find((b) => b.id === id),
      addBooking,
      setStatus,
      assignBooking,
      reassignBooking,
      unassignBooking,
      applyDiscount,
    }),
    [
      bookings,
      addBooking,
      setStatus,
      assignBooking,
      reassignBooking,
      unassignBooking,
      applyDiscount,
    ]
  );

  return (
    <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>
  );
}

export function useBookingsStore() {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookingsStore must be used within BookingsProvider");
  return ctx;
}
