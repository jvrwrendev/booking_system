import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockBookings } from "@/data/mock-bookings";
import type { Booking, BookingStatus } from "@/types/booking";

interface BookingsContextValue {
  bookings: Booking[];
  getBooking: (id: string) => Booking | undefined;
  setStatus: (id: string, status: BookingStatus) => void;
}

const BookingsContext = createContext<BookingsContextValue | null>(null);

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  const value = useMemo<BookingsContextValue>(
    () => ({
      bookings,
      getBooking: (id) => bookings.find((b) => b.id === id),
      setStatus: (id, status) => {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, status } : b
          )
        );
        toast.success("Booking status updated", {
          description: `Booking marked as ${status}.`,
        });
      },
    }),
    [bookings]
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