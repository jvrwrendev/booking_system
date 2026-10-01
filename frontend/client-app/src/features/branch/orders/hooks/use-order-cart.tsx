import React, { createContext, useContext, useMemo, useState } from "react";

export interface OrderCartItem {
  productId: string;
  quantity: number;
}

interface OrderCartContextValue {
  items: OrderCartItem[];
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const OrderCartContext = createContext<OrderCartContextValue | null>(null);

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OrderCartItem[]>([]);

  const value = useMemo<OrderCartContextValue>(
    () => ({
      items,
      addItem: (productId, quantity = 1) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.productId === productId);
          if (existing) {
            return prev.map((i) =>
              i.productId === productId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            );
          }
          return [...prev, { productId, quantity }];
        }),
      removeItem: (productId) =>
        setItems((prev) => prev.filter((i) => i.productId !== productId)),
      clear: () => setItems([]),
    }),
    [items],
  );

  return (
    <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>
  );
}

export function useOrderCart(): OrderCartContextValue {
  const ctx = useContext(OrderCartContext);
  if (!ctx) throw new Error("useOrderCart must be used within OrderCartProvider");
  return ctx;
}