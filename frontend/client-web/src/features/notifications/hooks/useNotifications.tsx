import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockProducts } from "@/data/mock-products";
import { mockBookings } from "@/data/mock-bookings";
import type { AppNotification } from "@/features/notifications/types";

const STORAGE_KEY = "agrivet-notifications-read-v1";

function loadReadIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function deriveNotifications(): AppNotification[] {
  const items: AppNotification[] = [];

  for (const product of mockProducts) {
    if (product.stockQuantity > product.minimumStockLevel) continue;
    const isOut = product.stockQuantity <= 0;
    items.push({
      id: `stock-${product.id}`,
      title: isOut
        ? `${product.name} is out of stock`
        : `${product.name} is running low`,
      description: isOut
        ? `SKU ${product.sku} has no units left. Restock to resume orders.`
        : `${product.stockQuantity} units left against a minimum of ${product.minimumStockLevel} (${product.sku}).`,
      timestamp: product.updatedAt,
      href: "/inventory",
      variant: isOut ? "destructive" : "warning",
      read: false,
    });
  }

  for (const booking of mockBookings) {
    if (booking.status !== "pending") continue;
    items.push({
      id: `booking-${booking.id}`,
      title: `Booking ${booking.reference} awaits approval`,
      description: `${booking.customerName} · ${booking.branchName}`,
      timestamp: booking.createdAt,
      href: `/bookings/${booking.id}`,
      variant: "info",
      read: false,
    });
  }

  return items.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [readIds, setReadIds] = useState<string[]>(loadReadIds);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [readIds]);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(deriveNotifications().map((n) => n.id));
  }, []);

  const notifications = useMemo(
    () =>
      deriveNotifications().map((n) => ({
        ...n,
        read: readIds.includes(n.id),
      })),
    [readIds]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead }),
    [notifications, unreadCount, markRead, markAllRead]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
