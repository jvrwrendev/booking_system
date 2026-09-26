export type StockStatus = "in_stock" | "low_stock" | "critical" | "out_of_stock";

/**
 * Single source of truth for stock indicators.
 *
 * Out-of-stock and low-stock are always derived from the current quantity and
 * the minimum level; they are never stored on the product. Keeping a single
 * implementation prevents the product list, the inventory module, and the
 * dashboard from disagreeing about when a product is "low".
 */
export function getStockStatus(
  stockQuantity: number,
  minimumStockLevel: number
): StockStatus {
  if (stockQuantity <= 0) return "out_of_stock";
  // Without a reorder threshold there is nothing to be low on.
  if (minimumStockLevel <= 0) return "in_stock";
  if (stockQuantity <= Math.ceil(minimumStockLevel / 2)) return "critical";
  if (stockQuantity <= minimumStockLevel) return "low_stock";
  return "in_stock";
}

export function isOutOfStock(stockQuantity: number): boolean {
  return stockQuantity <= 0;
}

/** Low stock excludes out-of-stock so the two counters never overlap. */
export function isLowStock(
  stockQuantity: number,
  minimumStockLevel: number
): boolean {
  if (stockQuantity <= 0) return false;
  return minimumStockLevel > 0 && stockQuantity <= minimumStockLevel;
}

export interface StockAdjustment {
  productId: string;
  quantity: number;
}

/**
 * Resolves a set of stock movements against the current quantities.
 *
 * Returns the movements that can be applied plus the ones that would push a
 * product below zero, so callers can refuse the whole operation rather than
 * silently truncating it.
 */
export function resolveStockMovements(
  products: { id: string; stockQuantity: number }[],
  movements: StockAdjustment[]
): { applied: StockAdjustment[]; rejected: { productId: string; requested: number; available: number }[] } {
  const available = new Map(products.map((p) => [p.id, p.stockQuantity]));
  const pending = new Map<string, number>();

  const applied: StockAdjustment[] = [];
  const rejected: { productId: string; requested: number; available: number }[] = [];

  for (const movement of movements) {
    const current = pending.get(movement.productId) ?? available.get(movement.productId) ?? 0;
    const next = current + movement.quantity;
    if (next < 0) {
      rejected.push({
        productId: movement.productId,
        requested: movement.quantity,
        available: current,
      });
      continue;
    }
    pending.set(movement.productId, next);
    applied.push(movement);
  }

  return { applied, rejected };
}

export type StockLineResult =
  | { ok: true; warning?: string }
  | { ok: false; error: string };

/**
 * Validates order lines before they are committed or released.
 *
 * A zero or negative quantity is refused rather than clamped. Clamping would
 * silently drop the bad line and let the rest of the order through, and letting
 * it through would commit and later restore the same line with inverted signs,
 * so a cancellation would return stock that was never taken.
 */
export function validateStockLines(lines: StockAdjustment[]): StockLineResult {
  for (const line of lines) {
    if (!Number.isFinite(line.quantity)) {
      return {
        ok: false,
        error: `Cannot process stock for ${line.productId}: quantity is not a number.`,
      };
    }
    if (line.quantity <= 0) {
      return {
        ok: false,
        error: `Cannot process stock for ${line.productId}: quantity must be greater than zero.`,
      };
    }
  }
  return { ok: true };
}

/**
 * Reports order lines whose product is no longer in the catalog.
 *
 * This warns instead of refusing. Deducting treats an unknown product as having
 * no stock, so refusing the release would be symmetric, but it would also leave
 * the booking with no way to close: both releasing statuses would be blocked by
 * the same orphaned line. Completing the transition and reporting the units
 * that could not be returned keeps the booking actionable and makes the gap
 * visible, instead of stranding it silently.
 */
export function validateStockRelease(
  products: { id: string }[],
  lines: StockAdjustment[]
): StockLineResult {
  const known = new Set(products.map((p) => p.id));
  const orphans = lines.filter((l) => !known.has(l.productId));
  if (orphans.length === 0) return { ok: true };

  const noun = orphans.length === 1 ? "product is" : "products are";
  return {
    ok: true,
    warning: `${orphans.length} ${noun} no longer in the catalog (${orphans
      .map((o) => `${o.productId} x${o.quantity}`)
      .join(", ")}), so those units could not be returned.`,
  };
}
