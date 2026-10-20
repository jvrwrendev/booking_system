import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { mockBranches } from "@/data/mock-branches";
import type { Branch, BranchFormValues } from "@/types/branch";
import { formatAddress } from "@/lib/utils";

interface BranchesContextValue {
  branches: Branch[];
  addBranch: (data: BranchFormValues) => Branch;
  updateBranch: (id: string, data: BranchFormValues) => void;
  toggleStatus: (id: string, status: Branch["status"]) => void;
  getBranch: (id: string) => Branch | undefined;
}

const BranchesContext = createContext<BranchesContextValue | null>(null);

function nextId(existing: Branch[]): string {
  const max = existing
    .map((b) => Number(b.id.replace("BR-", "")))
    .filter((n) => !Number.isNaN(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return `BR-${String(max + 1).padStart(3, "0")}`;
}

export function BranchesProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(mockBranches);

  const value = useMemo<BranchesContextValue>(
    () => ({
      branches,
      addBranch: (data) => {
        const address = formatAddress(data.addressParts);
        const branch: Branch = {
          id: nextId(branches),
          name: data.name,
          code: data.code,
          email: data.email,
          password: data.password,
          manager: data.manager,
          contactNumber: data.contactNumber,
          address,
          addressParts: data.addressParts,
          status: data.status,
          totalProducts: 0,
          totalStock: 0,
          createdAt: new Date().toISOString(),
        };
        setBranches((prev) => [branch, ...prev]);
        toast.success("Branch added", {
          description: `${branch.name} has been added.`,
        });
        return branch;
      },
      updateBranch: (id, data) => {
        const address = formatAddress(data.addressParts);
        setBranches((prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  name: data.name,
                  code: data.code,
                  email: data.email,
                  password: data.password,
                  manager: data.manager,
                  contactNumber: data.contactNumber,
                  address,
                  addressParts: data.addressParts,
                  status: data.status,
                }
              : b
          )
        );
        toast.success("Branch updated");
      },
      toggleStatus: (id, status) => {
        setBranches((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        );
        toast.success("Branch status updated");
      },
      getBranch: (id) => branches.find((b) => b.id === id),
    }),
    [branches]
  );

  return (
    <BranchesContext.Provider value={value}>{children}</BranchesContext.Provider>
  );
}

export function useBranchesStore() {
  const ctx = useContext(BranchesContext);
  if (!ctx)
    throw new Error("useBranchesStore must be used within BranchesProvider");
  return ctx;
}
