import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Search, ShoppingCart, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProductsStore } from "@/features/products/hooks/useProductsStore";
import { useCustomersStore } from "@/features/customers/hooks/useCustomersStore";
import { useBookingsStore } from "@/features/bookings/hooks/useBookingsStore";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: typeof Package;
}

const MAX_PER_GROUP = 4;

/**
 * Global search across products, customers and bookings.
 *
 * Replaces the header's decorative search input with a working one: results
 * are grouped by entity and link straight to the record.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { products } = useProductsStore();
  const { customers } = useCustomersStore();
  const { bookings } = useBookingsStore();

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const productHits: SearchResult[] = products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.sku,
        href: `/products/${p.id}`,
        icon: Package,
      }));

    const customerHits: SearchResult[] = customers
      .filter((c) => c.fullName.toLowerCase().includes(q))
      .slice(0, MAX_PER_GROUP)
      .map((c) => ({
        id: c.id,
        title: c.fullName,
        subtitle: c.email,
        href: `/customers/${c.id}`,
        icon: Users,
      }));

    const bookingHits: SearchResult[] = bookings
      .filter(
        (b) =>
          b.reference.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q)
      )
      .slice(0, MAX_PER_GROUP)
      .map((b) => ({
        id: b.id,
        title: b.reference,
        subtitle: b.customerName,
        href: `/bookings/${b.id}`,
        icon: ShoppingCart,
      }));

    return [
      { label: "Products", results: productHits },
      { label: "Customers", results: customerHits },
      { label: "Bookings", results: bookingHits },
    ].filter((g) => g.results.length > 0);
  }, [query, products, customers, bookings]);

  const total = groups.reduce((sum, g) => sum + g.results.length, 0);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    navigate(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 w-full max-w-sm justify-start gap-2 font-normal text-muted-foreground"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden flex-1 text-left sm:inline">
            Search products, customers, bookings…
          </span>
          <span className="flex-1 text-left sm:hidden">Search</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[380px] max-w-[calc(100vw-2rem)] p-0">
        <div className="relative border-b">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search products, customers and bookings"
            className="h-10 border-0 pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {query.trim().length < 2 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            Type at least two characters to search.
          </p>
        ) : total === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No results for “{query.trim()}”.
          </p>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="p-2">
              {groups.map((group) => (
                <div key={group.label} className="mb-2 last:mb-0">
                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </div>
                  {group.results.map((result) => {
                    const Icon = result.icon;
                    return (
                      <button
                        key={`${group.label}-${result.id}`}
                        type="button"
                        onClick={() => handleSelect(result.href)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                          "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        )}
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {result.title}
                          </span>
                          {result.subtitle && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
