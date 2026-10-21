import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mockBookings } from "@/data/mock-bookings";
import type { AppNotification } from "@/features/notifications/types";
import { useAuth } from "@/hooks/useAuth";
import { listInventoryAlerts } from "@/features/inventory/services/inventory.service";
import type { InventoryItem } from "@/types/inventory";

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

function deriveNotifications(alerts: InventoryItem[]): AppNotification[] {
  const items: AppNotification[] = [];

  for (const product of alerts) {
    const isOut = product.currentStock <= 0;
    items.push({
      id: `stock-${product.productId}`,
      title: isOut
        ? `${product.productName} is out of stock`
        : `${product.productName} is running low`,
      description: isOut
        ? `SKU ${product.sku} has no units left. Restock to resume orders.`
        : `${product.currentStock} units left against a minimum of ${product.minimumStock} (${product.sku}).`,
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
  /** True while the stock alerts are still being fetched. */
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [readIds, setReadIds] = useState<string[]>(loadReadIds);
  const [stockAlerts, setStockAlerts] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setStockAlerts([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listInventoryAlerts(undefined, 20)
      .then((alerts) => {
        if (!cancelled) setStockAlerts(alerts);
      })
      .catch(() => {
        // Notifications are ancillary; a failed fetch must not break the shell.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
    setReadIds(deriveNotifications(stockAlerts).map((n) => n.id));
  }, [stockAlerts]);

  const notifications = useMemo(
    () =>
      deriveNotifications(stockAlerts).map((n) => ({
        ...n,
        read: readIds.includes(n.id),
      })),
    [stockAlerts, readIds]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, markRead, markAllRead }),
    [notifications, unreadCount, loading, markRead, markAllRead]
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
