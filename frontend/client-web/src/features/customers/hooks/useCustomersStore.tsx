import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockCustomers } from "@/data/mock-customers";
import type { Customer, CustomerFormValues } from "@/types/customer";
import { mockAgents } from "@/data/mock-agents";
import { computeFullName, formatAddress } from "@/lib/utils";

interface CustomersContextValue {
  customers: Customer[];
  addCustomer: (data: CustomerFormValues) => Customer;
  updateCustomer: (id: string, data: CustomerFormValues) => void;
  toggleStatus: (id: string, status: Customer["status"]) => void;
  getCustomer: (id: string) => Customer | undefined;
}

const CustomersContext = createContext<CustomersContextValue | null>(null);

function nextId(existing: Customer[]): string {
  const max = existing
    .map((c) => Number(c.id.replace("CUS-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `CUS-${String(max + 1).padStart(3, "0")}`;
}

export function CustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const value = useMemo<CustomersContextValue>(
    () => ({
      customers,
      addCustomer: (data) => {
        const agent = mockAgents.find((a) => a.id === data.assignedAgentId);
        const fullName = computeFullName(data.firstName, data.middleName, data.lastName, data.suffix);
        const address = formatAddress(data.addressParts);
        const customer: Customer = {
          id: nextId(customers),
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          suffix: data.suffix,
          fullName,
          email: data.email,
          password: data.password,
          contactNumber: data.contactNumber,
          address,
          addressParts: data.addressParts,
          assignedAgentId: data.assignedAgentId,
          assignedAgentName: agent?.fullName ?? "",
          status: data.status,
          totalBookings: 0,
          totalPurchases: 0,
          registeredDate: new Date().toISOString(),
        };
        setCustomers((prev) => [customer, ...prev]);
        toast.success("Customer added", {
          description: `${fullName} has been added.`,
        });
        return customer;
      },
      updateCustomer: (id, data) => {
        const agent = mockAgents.find((a) => a.id === data.assignedAgentId);
        const fullName = computeFullName(data.firstName, data.middleName, data.lastName, data.suffix);
        const address = formatAddress(data.addressParts);
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  firstName: data.firstName,
                  middleName: data.middleName,
                  lastName: data.lastName,
                  suffix: data.suffix,
                  fullName,
                  email: data.email,
                  password: data.password,
                  contactNumber: data.contactNumber,
                  address,
                  addressParts: data.addressParts,
                  assignedAgentId: data.assignedAgentId,
                  assignedAgentName: agent?.fullName ?? "",
                  status: data.status,
                }
              : c
          )
        );
        toast.success("Customer updated");
      },
      toggleStatus: (id, status) => {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status } : c))
        );
        toast.success("Customer status updated");
      },
      getCustomer: (id) => customers.find((c) => c.id === id),
    }),
    [customers]
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
