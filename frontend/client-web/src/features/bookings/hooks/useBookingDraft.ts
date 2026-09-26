import { useCallback, useMemo, useState } from "react";

import type { BookingItem } from "@/types/booking";

/**
 * Line items being assembled on the booking form.
 *
 * Kept local to the page instead of in a provider: a draft belongs to a single
 * in-progress form, not to the application.
 */
export function useBookingDraft() {
  const [items, setItems] = useState<BookingItem[]>([]);

  const addItem = useCallback((item: BookingItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (!existing) return [...prev, item];
      // Re-adding the same product bumps the quantity instead of duplicating
      // the row, so a line never appears twice in one booking.
      return prev.map((i) =>
        i.productId === item.productId
          ? {
              ...i,
              quantity: i.quantity + item.quantity,
              subtotal: (i.quantity + item.quantity) * i.unitPrice,
            }
          : i
      );
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity, subtotal: quantity * i.unitPrice }
              : i
          )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.subtotal, 0),
    [items]
  );

  /** Quantities already drafted, so the picker can show the remaining stock. */
  const quantityByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.productId, item.quantity);
    return map;
  }, [items]);

  return {
    items,
    totalQuantity,
    subtotal,
    quantityByProduct,
    addItem,
    setQuantity,
    removeItem,
    clear,
  };
}
