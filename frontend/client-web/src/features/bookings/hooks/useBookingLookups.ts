import { useEffect, useState } from "react";
import type { AuthUser } from "@/types/auth";
import type { InventoryBranch } from "@/types/inventory";
import { listInventoryBranches } from "@/features/inventory/services/inventory.service";
import {
  listAssignableAdmins,
  listBookingAgents,
  type BookingAgentOption,
} from "../services/bookings.service";

/**
 * Branch/agent/admin option lists shared by the booking screens. These are
 * supporting lookups: a failure leaves the relevant filter empty instead of
 * blocking the page itself.
 */
export function useBookingLookups(includeAdmins = false) {
  const [branches, setBranches] = useState<InventoryBranch[]>([]);
  const [agents, setAgents] = useState<BookingAgentOption[]>([]);
  const [admins, setAdmins] = useState<AuthUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    listInventoryBranches()
      .then((result) => {
        if (!cancelled) setBranches(result);
      })
      .catch(() => {
        // Filters remain usable without the branch list.
      });
    listBookingAgents()
      .then((result) => {
        if (!cancelled) setAgents(result);
      })
      .catch(() => {
        // Filters remain usable without the agent list.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!includeAdmins) return;
    let cancelled = false;
    listAssignableAdmins()
      .then((result) => {
        if (!cancelled) setAdmins(result);
      })
      .catch(() => {
        // Assignment dialogs show an empty picker if admins cannot load.
      });
    return () => {
      cancelled = true;
    };
  }, [includeAdmins]);

  return { branches, agents, admins };
}
