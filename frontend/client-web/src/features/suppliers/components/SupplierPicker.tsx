import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useDebounce, usePermissions } from "@/hooks/usePermissions";
import type { Supplier } from "@/types/supplier";
import {
  createSupplier,
  listAllSuppliers,
} from "../services/suppliers.service";
import { SupplierAddDialog } from "./SupplierAddDialog";

interface SupplierPickerProps {
  id?: string;
  value?: string;
  selectedName?: string;
  onChange: (supplierId: string, supplierName: string) => void;
  disabled?: boolean;
}

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
    setOpen(false);
    setAddOpen(true);
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
                placeholder="Search suppliers…"
                aria-label="Search suppliers"
                className="h-9 pl-8"
              />
            </div>
          </div>

          <ScrollArea className="max-h-64">
            <div className="p-1" role="listbox" aria-label="Suppliers">
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
                <EmptyState
                  icon={<Building2 className="h-5 w-5" aria-hidden />}
                  title={hasLoaded ? "No suppliers found" : "No suppliers yet"}
                  description={
                    search
                      ? "Try a different supplier name."
                      : "Add a supplier to start linking products."
                  }
                  className="border-0 py-8"
                />
              ) : (
                suppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    role="option"
                    aria-selected={supplier.id === value}
                    onClick={() => handleSelect(supplier)}
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{supplier.name}</span>
                      {supplier.status === "inactive" && (
                        <span className="text-xs text-muted-foreground">
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

          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
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
                className="h-6 gap-1 px-2 text-xs"
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
        <Button
          type="button"
          variant="ghost"
          size="iconSm"
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2"
          aria-label="Clear supplier"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </Button>
      )}

      {loading && open && (
        <Spinner className="absolute right-8 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
      )}

      <SupplierAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={createSupplier}
        onCreated={async (supplier) => {
          onChange(supplier.id, supplier.name);
          setSearch("");
          await load("");
        }}
      />
    </div>
  );
}
