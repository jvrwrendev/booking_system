import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Customer } from "@/types/customer";
import { emptyAddress } from "@/lib/utils";
import { useAgentsStore } from "@/features/agents/hooks/useAgentsStore";
import { useCustomersStore } from "../hooks/useCustomersStore";

interface CustomerAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  assignedAgentId: string;
  status: Customer["status"];
}

const EMPTY_VALUES: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  contactNumber: "",
  assignedAgentId: "",
  status: "active",
};

/** Customers added here get a temporary password they can replace via Edit. */
function temporaryPassword(): string {
  return `Tmp-${Math.random().toString(36).slice(2, 12)}`;
}

export function CustomerAddDialog({
  open,
  onOpenChange,
}: CustomerAddDialogProps) {
  const { addCustomer } = useCustomersStore();
  const { agents } = useAgentsStore();
  const [values, setValues] = useState<FormState>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);

  const activeAgents = agents.filter((agent) => agent.status === "active");

  const reset = () => {
    setValues(EMPTY_VALUES);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!values.firstName.trim() || !values.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!values.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    addCustomer({
      firstName: values.firstName.trim(),
      middleName: "",
      lastName: values.lastName.trim(),
      suffix: "",
      email: values.email.trim(),
      password: temporaryPassword(),
      contactNumber: values.contactNumber.trim(),
      addressParts: emptyAddress(),
      assignedAgentId: values.assignedAgentId,
      status: values.status,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <UserPlus className="h-4 w-4" />
            </span>
            Add customer
          </DialogTitle>
          <DialogDescription>
            Add the essentials now. Address, password, and other details can be
            completed from the customer's edit page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-add-first">First name *</Label>
              <Input
                id="customer-add-first"
                value={values.firstName}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    firstName: event.target.value,
                  }))
                }
                placeholder="Ricardo"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-add-last">Last name *</Label>
              <Input
                id="customer-add-last"
                value={values.lastName}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    lastName: event.target.value,
                  }))
                }
                placeholder="Bautista"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-add-email">Email *</Label>
              <Input
                id="customer-add-email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                placeholder="customer@email.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-add-phone">Contact number</Label>
              <Input
                id="customer-add-phone"
                value={values.contactNumber}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    contactNumber: event.target.value,
                  }))
                }
                placeholder="+63 9XX XXX XXXX"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-add-agent">Assigned agent</Label>
              <Select
                value={values.assignedAgentId}
                onValueChange={(next) =>
                  setValues((previous) => ({
                    ...previous,
                    assignedAgentId: next,
                  }))
                }
              >
                <SelectTrigger id="customer-add-agent">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {activeAgents.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No active agents
                    </SelectItem>
                  ) : (
                    activeAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.fullName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-add-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(next) =>
                  setValues((previous) => ({
                    ...previous,
                    status: next as Customer["status"],
                  }))
                }
              >
                <SelectTrigger id="customer-add-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create customer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
