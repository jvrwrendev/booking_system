import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "@/constants";
import type { BookingItem } from "@/types/booking";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import { buildBookingItem } from "@/services/booking.service";

interface StoredCart {
  customer: Customer | null;
  items: BookingItem[];
}

const EMPTY: StoredCart = { customer: null, items: [] };

async function persist(cart: StoredCart) {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CART_AGENT, JSON.stringify(cart));
  } catch {
    // ignore persistence errors
  }
}

export async function readAgentCart(): Promise<StoredCart> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.CART_AGENT);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as StoredCart;
    return {
      customer: parsed.customer ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return EMPTY;
  }
}

export function useAgentCart() {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [items, setItems] = useState<BookingItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const cart = await readAgentCart();
      if (!mounted) return;
      setCustomerState(cart.customer);
      setItems(cart.items);
      setHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback((next: StoredCart) => {
    setCustomerState(next.customer);
    setItems(next.items);
    void persist(next);
  }, []);

  const setCustomer = useCallback(
    (next: Customer | null) => {
      update({ customer: next, items });
    },
    [items, update],
  );

  const addItem = useCallback(
    (product: Product, quantity: number) => {
      if (quantity <= 0) return;
      const existing = items.find((i) => i.productId === product.id);
      const nextItems = existing
        ? items.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + quantity, subtotal: (i.quantity + quantity) * i.unitPrice }
              : i,
          )
        : [...items, buildBookingItem(product, quantity)];
      update({ customer, items: nextItems });
    },
    [customer, items, update],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const nextItems =
        quantity <= 0
          ? items.filter((i) => i.productId !== productId)
          : items.map((i) =>
              i.productId === productId
                ? { ...i, quantity, subtotal: quantity * i.unitPrice }
                : i,
            );
      update({ customer, items: nextItems });
    },
    [customer, items, update],
  );

  const removeItem = useCallback(
    (productId: string) => {
      update({ customer, items: items.filter((i) => i.productId !== productId) });
    },
    [customer, items, update],
  );

  const clear = useCallback(() => {
    update(EMPTY);
  }, [update]);

  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);

  return {
    customer,
    items,
    hydrated,
    totalQuantity,
    subtotal,
    setCustomer,
    addItem,
    setQuantity,
    removeItem,
    clear,
  };
}
