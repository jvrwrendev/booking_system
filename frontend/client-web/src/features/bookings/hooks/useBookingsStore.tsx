import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockBookings } from "@/data/mock-bookings";
import type { AuthUser } from "@/types/auth";
import type { Booking, BookingStatus } from "@/types/booking";
import type { StatusHistoryEntry } from "@/types/order-history";
import { humanize } from "@/components/common/StatusBadge";
import { formatCurrency } from "@/lib/utils";

const STORAGE_KEY = "agrivet-bookings-v3";

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
  setStatus: (
    id: string,
    status: BookingStatus,
    by?: Pick<AuthUser, "id" | "fullName">
  ) => void;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      // Ignore quota/availability errors; state remains in-memory.
    }
  }, [bookings]);

  const setStatus = useCallback(
    (id: string, status: BookingStatus, by?: Pick<AuthUser, "id" | "fullName">) => {
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            status,
            statusHistory: [
              ...(b.statusHistory ?? []),
              historyEntry(b.status, status, by),
            ],
          };
        })
      );
      toast.success("Booking status updated", {
        description: `Booking marked as ${humanize(status)}.`,
      });
    },
    []
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
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id !== id) return b;
          const previous = b.discount ?? 0;
          const removed = discount === 0 && previous > 0;
          return {
            ...b,
            discount,
            totalAmount: Math.max(0, b.subtotal - discount),
            statusHistory: [
              ...(b.statusHistory ?? []),
              historyEntry(
                b.status,
                b.status,
                by,
                removed
                  ? "Discount removed"
                  : `Discount ${note ? `${note}: ` : ""}${formatCurrency(discount)}`
              ),
            ],
          };
        })
      );
      toast.success("Discount updated", {
        description:
          discount === 0
            ? "Discount removed from the order."
            : `Discount of ${formatCurrency(discount)} applied.`,
      });
    },
    []
  );

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      getBooking: (id) => bookings.find((b) => b.id === id),
      setStatus,
      assignBooking,
      reassignBooking,
      unassignBooking,
      applyDiscount,
    }),
    [bookings, setStatus, assignBooking, reassignBooking, unassignBooking, applyDiscount]
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
