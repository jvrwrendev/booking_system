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
import type { Branch, BranchFormValues } from "@/types/branch";
import {
  createBranch as createBranchRequest,
  listAllBranches,
  setBranchStatus,
  updateBranch as updateBranchRequest,
} from "../services/branches.service";

interface BranchesContextValue {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addBranch: (data: BranchFormValues) => Promise<Branch>;
  updateBranch: (id: string, data: BranchFormValues) => Promise<Branch>;
  toggleStatus: (id: string, status: Branch["status"]) => Promise<void>;
  getBranch: (id: string) => Branch | undefined;
}

const BranchesContext = createContext<BranchesContextValue | null>(null);

function messageFor(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function BranchesProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBranches(await listAllBranches());
    } catch (err) {
      setError(messageFor(err, "Could not load branches."));
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addBranch = useCallback(async (data: BranchFormValues) => {
    try {
      const created = await createBranchRequest(data);
      setBranches((previous) => [created, ...previous]);
      toast.success("Branch added", {
        description: `${created.name} has been added.`,
      });
      return created;
    } catch (err) {
      toast.error("Could not add branch", {
        description: messageFor(err, "Please try again."),
      });
      throw err;
    }
  }, []);

  const updateBranch = useCallback(
    async (id: string, data: BranchFormValues) => {
      try {
        const updated = await updateBranchRequest(id, data);
        setBranches((previous) =>
          previous.map((branch) =>
            branch.id === updated.id ? updated : branch,
          ),
        );
        toast.success("Branch updated", {
          description: `${updated.name} was saved.`,
        });
        return updated;
      } catch (err) {
        toast.error("Could not update branch", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [],
  );

  const toggleStatus = useCallback(
    async (id: string, status: Branch["status"]) => {
      try {
        const updated = await setBranchStatus(id, status);
        setBranches((previous) =>
          previous.map((branch) =>
            branch.id === updated.id ? updated : branch,
          ),
        );
        toast.success("Branch status updated", {
          description: `${updated.name} is now ${updated.status}.`,
        });
      } catch (err) {
        toast.error("Could not update branch status", {
          description: messageFor(err, "Please try again."),
        });
        throw err;
      }
    },
    [],
  );

  const value = useMemo<BranchesContextValue>(
    () => ({
      branches,
      loading,
      error,
      refresh,
      addBranch,
      updateBranch,
      toggleStatus,
      getBranch: (id) => branches.find((branch) => branch.id === id),
    }),
    [branches, loading, error, refresh, addBranch, updateBranch, toggleStatus],
  );

  return (
    <BranchesContext.Provider value={value}>
      {children}
    </BranchesContext.Provider>
  );
}

export function useBranchesStore() {
  const ctx = useContext(BranchesContext);
  if (!ctx)
    throw new Error("useBranchesStore must be used within BranchesProvider");
  return ctx;
}
