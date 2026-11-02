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

import { ApiError } from "@/lib/api-client";
import type { Customer, CustomerFormValues } from "@/types/customer";
import {
  createCustomer as createCustomerRequest,
  listAllCustomers,
  setCustomerStatus,
  updateCustomer as updateCustomerRequest,
} from "../services/customers.service";

interface CustomersContextValue {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addCustomer: (data: CustomerFormValues) => Promise<Customer>;
  updateCustomer: (id: string, data: CustomerFormValues) => Promise<Customer>;
  toggleStatus: (id: string, status: Customer["status"]) => Promise<void>;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCustomers(await listAllCustomers());
    } catch (err) {
      setError(messageFor(err, "Could not load customers."));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addCustomer = useCallback(async (data: CustomerFormValues) => {
    try {
      const created = await createCustomerRequest(data);
      setCustomers((previous) => [created, ...previous]);
      toast.success("Customer added", {
        description: `${created.fullName} has been added.`,
      });
      return created;
    } catch (err) {
      toast.error("Could not add customer", {
        description: messageFor(err, "Please try again."),
      });
      throw err;
    }
  }, []);

  const updateCustomer = useCallback(
    async (id: string, data: CustomerFormValues) => {
      try {
        const updated = await updateCustomerRequest(id, data);
        setCustomers((previous) =>
          previous.map((customer) =>
            customer.id === updated.id ? updated : customer,
          ),
        );
        toast.success("Customer updated", {
          description: `${updated.fullName} was saved.`,
        });
        return updated;
      } catch (err) {
        toast.error("Could not update customer", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [],
  );

  const toggleStatus = useCallback(
    async (id: string, status: Customer["status"]) => {
      try {
        const updated = await setCustomerStatus(id, status);
        setCustomers((previous) =>
          previous.map((customer) =>
            customer.id === updated.id ? updated : customer,
          ),
        );
        toast.success("Customer status updated", {
          description: `${updated.fullName} is now ${updated.status}.`,
        });
      } catch (err) {
        toast.error("Could not update customer status", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [],
  );

  const value = useMemo<CustomersContextValue>(
    () => ({
      customers,
      loading,
      error,
      refresh,
      addCustomer,
      updateCustomer,
      toggleStatus,
      getCustomer: (id) => customers.find((customer) => customer.id === id),
    }),
    [customers, loading, error, refresh, addCustomer, updateCustomer, toggleStatus],
  );

  return (
    <CustomersContext.Provider value={value}>
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomersStore() {
  const ctx = useContext(CustomersContext);
  if (!ctx)
    throw new Error("useCustomersStore must be used within CustomersProvider");
  return ctx;
}
