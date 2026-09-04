import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mockInventory,
  mockTransactions,
} from "@/data/mock-inventory";
import type {
  InventoryItem,
  InventoryTransaction,
  StockStatus,
} from "@/types/inventory";

interface InventoryContextValue {
  items: InventoryItem[];
  transactions: InventoryTransaction[];
  getItem: (id: string) => InventoryItem | undefined;
  recordTransaction: (tx: InventoryTransaction) => void;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [transactions, setTransactions] =
    useState<InventoryTransaction[]>(mockTransactions);

  const value = useMemo<InventoryContextValue>(
    () => ({
      items,
      transactions,
      getItem: (id) => items.find((i) => i.id === id),
      recordTransaction: (tx) => {
        setTransactions((prev) => [tx, ...prev]);
        setItems((prev) =>
          prev.map((i) => {
            if (i.id !== tx.productId && i.id !== `${tx.productId}-${tx.branchId}`)
              return i;
            const reserved = i.reservedStock ?? 0;
            const status: StockStatus =
              tx.newStock <= 0
                ? "out_of_stock"
                : tx.newStock <= Math.max(i.minimumStock / 2, 1)
                ? "critical"
                : tx.newStock <= i.minimumStock
                ? "low_stock"
                : "in_stock";
            return {
              ...i,
              currentStock: tx.newStock,
              availableStock: Math.max(0, tx.newStock - reserved),
              status,
            };
          })
        );
      },
    }),
    [items, transactions]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventoryStore() {
  const ctx = useContext(InventoryContext);
  if (!ctx)
    throw new Error("useInventoryStore must be used within InventoryProvider");
  return ctx;
}
