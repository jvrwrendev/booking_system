import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/types/role";

export function useRole() {
  const { user } = useAuth();
  return {
    role: user?.role ?? null,
    label: user?.role ? ROLE_LABELS[user.role] : "",
    isAgent: user?.role === "AGENT",
    isBranch: user?.role === "BRANCH",
  };
}
