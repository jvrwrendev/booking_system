import { Package } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export interface OrderItemRow {
  /** Stable key for the row. */
  key: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderItemsTableProps {
  items: OrderItemRow[];
  className?: string;
}

/**
 * The line-item table shared by booking and order detail pages.
 *
 * Built on the shadcn `Table` primitives so it inherits the same header
 * treatment, borders and typography as every other table in the app.
 */
export function OrderItemsTable({ items, className }: OrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No items on this order.
      </p>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Product</TableHead>
            <TableHead scope="col" className="text-right">
              Quantity
            </TableHead>
            <TableHead scope="col" className="text-right">
              Unit price
            </TableHead>
            <TableHead scope="col" className="text-right">
              Subtotal
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.key}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Package
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">
                      {item.productName}
                    </span>
                    {item.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.sku}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {item.quantity}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(item.unitPrice)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(item.subtotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
