import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import { buildBranchOrderItem } from "@/services/branch-order.service";
import type { BranchOrderItem } from "@/types/branch-order";
import type { Product } from "@/types/product";

interface OrderCartContextValue {
  items: BranchOrderItem[];
  hydrated: boolean;
  totalQuantity: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const OrderCartContext = createContext<OrderCartContextValue | null>(null);

async function persist(items: BranchOrderItem[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CART_BRANCH, JSON.stringify(items));
  } catch {
    // ignore persistence errors
  }
}

async function readItems(): Promise<BranchOrderItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CART_BRANCH);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BranchOrderItem[]) : [];
  } catch {
    return [];
  }
}

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BranchOrderItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const stored = await readItems();
      if (!mounted) return;
      setItems(stored);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback((next: BranchOrderItem[]) => {
    setItems(next);
    void persist(next);
  }, []);

  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      if (quantity <= 0) return;
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        const next = existing
          ? prev.map((i) =>
              i.productId === product.id
                ? {
                    ...i,
                    quantity: i.quantity + quantity,
                    subtotal: (i.quantity + quantity) * i.unitPrice,
                  }
                : i,
            )
          : [...prev, buildBranchOrderItem(product, quantity)];
        void persist(next);
        return next;
      });
    },
    [],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      setItems((prev) => {
        const next =
          quantity <= 0
            ? prev.filter((i) => i.productId !== productId)
            : prev.map((i) =>
                i.productId === productId
                  ? { ...i, quantity, subtotal: quantity * i.unitPrice }
                  : i,
              );
        void persist(next);
        return next;
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        void persist(next);
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => update([]), [update]);

  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);

  const value = useMemo<OrderCartContextValue>(
    () => ({
      items,
      hydrated,
      totalQuantity,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, hydrated, totalQuantity, subtotal, addItem, setQuantity, removeItem, clear],
  );

  return (
    <OrderCartContext.Provider value={value}>
      {children}
    </OrderCartContext.Provider>
  );
}

export function useOrderCart(): OrderCartContextValue {
  const ctx = useContext(OrderCartContext);
  if (!ctx) throw new Error("useOrderCart must be used within OrderCartProvider");
  return ctx;
}
