import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce, usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api-client";
import type { Supplier, SupplierFormValues } from "@/types/supplier";
import {
  createSupplier,
  listAllSuppliers,
} from "../services/suppliers.service";

interface SupplierPickerProps {
  id?: string;
  value?: string;
  selectedName?: string;
  onChange: (supplierId: string, supplierName: string) => void;
  disabled?: boolean;
}

const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: "",
  contactName: "",
  email: "",
  contactNumber: "",
  address: "",
  status: "active",
};

export function SupplierPicker({
  id,
  value,
  selectedName,
  onChange,
  disabled,
}: SupplierPickerProps) {
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<SupplierFormValues>(EMPTY_SUPPLIER_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch every matching supplier (the service pages through the API's
      // 100-row cap) so the picker shows the complete Supplier Management list.
      const result = await listAllSuppliers({
        search: term.trim() || undefined,
      });
      setSuppliers(result);
      setHasLoaded(true);
    } catch {
      setError("Could not load suppliers. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load(debouncedSearch);
  }, [open, debouncedSearch, load]);

  const selected = useMemo(
    () => suppliers.find((supplier) => supplier.id === value),
    [suppliers, value],
  );
  const displayName = selected?.name ?? selectedName;

  const handleSelect = (supplier: Supplier) => {
    onChange(supplier.id, supplier.name);
    setOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    onChange("", "");
    setSearch("");
  };

  const openAddDialog = () => {
    setForm(EMPTY_SUPPLIER_FORM);
    setFormError(null);
    setOpen(false);
    setAddOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError("Supplier name is required.");
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const supplier = await createSupplier(form);
      setAddOpen(false);
      onChange(supplier.id, supplier.name);
      setSearch("");
      await load("");
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not create the supplier.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="h-10 w-full justify-between pr-10 font-normal"
          >
            <span className="flex min-w-0 items-center gap-2">
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span
                className={
                  displayName
                    ? "truncate"
                    : "truncate text-muted-foreground"
                }
              >
                {displayName || "Select supplier (optional)"}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-[340px] max-w-[calc(100vw-2rem)] p-0"
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search suppliers..."
                className="h-9 pl-8"
              />
            </div>
          </div>

          <ScrollArea className="max-h-64">
            <div className="p-1">
              {loading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="space-y-2 p-3 text-center">
                  <p className="text-xs text-destructive">{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void load(debouncedSearch)}
                  >
                    Retry
                  </Button>
                </div>
              ) : suppliers.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm font-medium">
                    {hasLoaded ? "No suppliers found" : "No suppliers yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {search
                      ? "Try a different supplier name."
                      : "Add a supplier to start linking products."}
                  </p>
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => handleSelect(supplier)}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{supplier.name}</span>
                      {supplier.status === "inactive" && (
                        <span className="text-[11px] text-muted-foreground">
                          Inactive
                        </span>
                      )}
                    </span>
                    {supplier.id === value && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between border-t px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              {loading
                ? "Loading suppliers…"
                : `${suppliers.length} supplier${suppliers.length === 1 ? "" : "s"} shown`}
            </span>
            {can("suppliers.create") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={openAddDialog}
              >
                <Plus className="h-3 w-3" />
                Add supplier
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear supplier"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {loading && open && (
        <Loader2 className="absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      <Dialog
        open={addOpen}
        onOpenChange={(next) => {
          if (!saving) setAddOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add supplier</DialogTitle>
            <DialogDescription>
              Create a supplier here and it will be selected on this product.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="new-supplier-name">Supplier name *</Label>
              <Input
                id="new-supplier-name"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Supplier name"
                disabled={saving}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-supplier-contact">Contact person</Label>
                <Input
                  id="new-supplier-contact"
                  value={form.contactName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      contactName: event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-supplier-phone">Contact number</Label>
                <Input
                  id="new-supplier-phone"
                  value={form.contactNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      contactNumber: event.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-supplier-email">Email</Label>
              <Input
                id="new-supplier-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-supplier-address">Address</Label>
              <Textarea
                id="new-supplier-address"
                value={form.address}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, address: event.target.value }))
                }
                rows={2}
                disabled={saving}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
