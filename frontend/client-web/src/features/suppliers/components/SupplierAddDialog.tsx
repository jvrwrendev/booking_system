import { useState } from "react";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

import { ApiError } from "@/lib/api-client";
import type { Supplier, SupplierFormValues } from "@/types/supplier";

interface SupplierAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Creates the supplier. Resolving with the record enables `onCreated`. */
  onSubmit: (values: SupplierFormValues) => Promise<Supplier | void>;
  /** Called with the freshly created supplier so callers can select it. */
  onCreated?: (supplier: Supplier) => void;
}

const EMPTY_VALUES: SupplierFormValues = {
  name: "",
  contactName: "",
  contactNumber: "",
  address: "",
  status: "active",
};

export function SupplierAddDialog({
  open,
  onOpenChange,
  onSubmit,
  onCreated,
}: SupplierAddDialogProps) {
  const [values, setValues] = useState<SupplierFormValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setValues(EMPTY_VALUES);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (saving) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Supplier name is required.");
      return;
    }
    if (values.contactNumber.trim().length > 40) {
      setError("Contact number cannot exceed 40 characters.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const created = await onSubmit(values);
      if (created && onCreated) onCreated(created);
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not create the supplier."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-4 w-4" aria-hidden />
            </span>
            Add supplier
          </DialogTitle>
          <DialogDescription>
            Only the business name is required. You can add the address and
            other details later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-add-name">Supplier name *</Label>
              <Input
                id="supplier-add-name"
                value={values.name}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g., NutriGrow Philippines"
                autoFocus
                disabled={saving}
                aria-invalid={!!error}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-add-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(next) =>
                  setValues((previous) => ({
                    ...previous,
                    status: next as Supplier["status"],
                  }))
                }
                disabled={saving}
              >
                <SelectTrigger id="supplier-add-status" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="supplier-add-contact">Contact person</Label>
              <Input
                id="supplier-add-contact"
                value={values.contactName}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    contactName: event.target.value,
                  }))
                }
                placeholder="Optional"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplier-add-phone">Contact number</Label>
              <Input
                id="supplier-add-phone"
                value={values.contactNumber}
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    contactNumber: event.target.value,
                  }))
                }
                placeholder="Optional"
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="supplier-add-address">Address</Label>
            <Textarea
              id="supplier-add-address"
              value={values.address}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  address: event.target.value,
                }))
              }
              rows={2}
              placeholder="Optional"
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating…" : "Create supplier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
