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
import type { AuthUser } from "@/types/auth";
import type { Booking, BookingStatus } from "@/types/booking";
import { ApiError } from "@/lib/api-client";
import { humanize } from "@/lib/status";
import { formatCurrency } from "@/lib/utils";
import {
  applyBookingDiscount,
  assignBooking as assignBookingRequest,
  getBooking as getBookingRequest,
  listBookings,
  unassignBooking as unassignBookingRequest,
  updateBookingStatus,
} from "../services/bookings.service";

interface BookingsContextValue {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getBooking: (id: string) => Booking | undefined;
  loadBooking: (id: string) => Promise<Booking | undefined>;
  removeBooking: (id: string) => void;
  setStatus: (
    id: string,
    status: BookingStatus,
    by?: Pick<AuthUser, "id" | "fullName">,
  ) => Promise<void>;
  assignBooking: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">,
  ) => Promise<void>;
  reassignBooking: (
    id: string,
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">,
  ) => Promise<void>;
  unassignBooking: (id: string) => Promise<void>;
  applyDiscount: (
    id: string,
    discount: number,
    by?: Pick<AuthUser, "id" | "fullName">,
    note?: string,
  ) => Promise<void>;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedIds = useRef(new Set<string>());

  const upsert = useCallback((booking: Booking) => {
    setBookings((prev) => {
      const index = prev.findIndex((item) => item.id === booking.id);
      if (index === -1) return [booking, ...prev];
      const next = [...prev];
      next[index] = booking;
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listBookings({
        pageSize: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setBookings((previous) => {
        const byId = new Map(previous.map((booking) => [booking.id, booking]));
        const listIds = new Set(result.bookings.map((booking) => booking.id));
        const merged = result.bookings.map((booking) => {
          const cached = byId.get(booking.id);
          if (!cached) return booking;
          return new Date(booking.updatedAt) >= new Date(cached.updatedAt)
            ? booking
            : cached;
        });
        // Keep bookings opened by direct link even when they are outside the
        // most recent 100 records returned by the list endpoint.
        for (const booking of previous) {
          if (!listIds.has(booking.id) && loadedIds.current.has(booking.id)) {
            merged.push(booking);
          }
        }
        return merged.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
      setError(null);
    } catch (err) {
      setError(errorMessage(err, "Could not load bookings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadBooking = useCallback(
    async (id: string) => {
      try {
        const booking = await getBookingRequest(id);
        loadedIds.current.add(id);
        upsert(booking);
        return booking;
      } catch (err) {
        if (!(err instanceof ApiError && err.isUnauthorized)) {
          toast.error("Could not load booking", {
            description: errorMessage(err, "Please try again."),
          });
        }
        return undefined;
      }
    },
    [upsert],
  );

  const removeBooking = useCallback((id: string) => {
    loadedIds.current.delete(id);
    setBookings((previous) => previous.filter((booking) => booking.id !== id));
  }, []);

  const setStatus = useCallback(
    async (
      id: string,
      status: BookingStatus,
      _by?: Pick<AuthUser, "id" | "fullName">,
    ) => {
      try {
        const booking = await updateBookingStatus(id, status);
        upsert(booking);
        toast.success("Booking status updated", {
          description: `Booking marked as ${humanize(status)}.`,
        });
      } catch (err) {
        toast.error("Could not update booking status", {
          description: errorMessage(err, "The booking status was not changed."),
        });
      }
    },
    [upsert],
  );

  const assign = useCallback(
    async (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      _by: Pick<AuthUser, "id" | "fullName">,
    ) => {
      try {
        const booking = await assignBookingRequest(id, { adminId: admin.id });
        upsert(booking);
        toast.success("Booking assigned", {
          description: `Booking assigned to ${admin.fullName}.`,
        });
      } catch (err) {
        toast.error("Could not assign booking", {
          description: errorMessage(err, "Please try again."),
        });
      }
    },
    [upsert],
  );

  const reassignBooking = useCallback(
    async (
      id: string,
      admin: Pick<AuthUser, "id" | "fullName">,
      by: Pick<AuthUser, "id" | "fullName">,
    ) => {
      try {
        const booking = await assignBookingRequest(id, { adminId: admin.id });
        upsert(booking);
        toast.success("Booking reassigned", {
          description: `Booking reassigned to ${admin.fullName}.`,
        });
      } catch (err) {
        toast.error("Could not reassign booking", {
          description: errorMessage(err, "Please try again."),
        });
      }
      void by;
    },
    [upsert],
  );

  const unassignBooking = useCallback(
    async (id: string) => {
      try {
        const booking = await unassignBookingRequest(id);
        upsert(booking);
        toast.success("Assignment removed", {
          description: "Booking is now unassigned.",
        });
      } catch (err) {
        toast.error("Could not remove assignment", {
          description: errorMessage(err, "Please try again."),
        });
      }
    },
    [upsert],
  );

  const applyDiscount = useCallback(
    async (
      id: string,
      discount: number,
      _by?: Pick<AuthUser, "id" | "fullName">,
      note?: string,
    ) => {
      try {
        const booking = await applyBookingDiscount(id, { discount, note });
        upsert(booking);
        toast.success("Discount updated", {
          description:
            discount === 0
              ? "Discount removed from the order."
              : `Discount of ${formatCurrency(discount)} applied.`,
        });
      } catch (err) {
        toast.error("Could not update discount", {
          description: errorMessage(err, "Please try again."),
        });
      }
    },
    [upsert],
  );

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      loading,
      error,
      refresh,
      getBooking: (id) => bookings.find((booking) => booking.id === id),
      loadBooking,
      removeBooking,
      setStatus,
      assignBooking: assign,
      reassignBooking,
      unassignBooking,
      applyDiscount,
    }),
    [
      bookings,
      loading,
      error,
      refresh,
      loadBooking,
      removeBooking,
      setStatus,
      assign,
      reassignBooking,
      unassignBooking,
      applyDiscount,
    ],
  );

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
}

export function useBookingsStore() {
  const ctx = useContext(BookingsContext);
  if (!ctx) {
    throw new Error("useBookingsStore must be used within BookingsProvider");
  }
  return ctx;
}
