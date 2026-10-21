import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Banknote,
  Boxes,
  Filter,
  PackageCheck,
  Sliders,
  Truck,
} from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatisticsCard } from "@/components/common/StatisticsCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import { useInventoryStore } from "../hooks/useInventoryStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import type {
  InventoryItem,
  InventoryTransaction,
  TransactionType,
} from "@/types/inventory";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api-client";

type StockAction = "stock_in" | "stock_out" | "adjustment" | "transfer";

export function InventoryPage() {
  const { can } = usePermissions();
  const {
    items,
    total,
    page,
    pageSize,
    loading,
    error,
    filters,
    summary,
    summaryLoading,
    summaryError,
    branches,
    transactions,
    transactionTotal,
    transactionPage,
    transactionPageSize,
    transactionLoading,
    transactionError,
    transactionFilters,
    setSearch,
    setCategoryFilter,
    setBranchFilter,
    setStatusFilter,
    setPage,
    setPageSize,
    refresh,
    setTransactionSearch,
    setTransactionTypeFilter,
    setTransactionBranchFilter,
    setTransactionPage,
    setTransactionPageSize,
    refreshTransactions,
    stockIn,
    stockOut,
    adjustStock,
    transferStock,
  } = useInventoryStore();
  const { options: categories } = useCategoriesStore();

  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<StockAction>("stock_in");
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const destinationBranches = useMemo(
    () =>
      branches.filter(
        (branch) =>
          branch.status === "active" && branch.id !== activeItem?.branchId,
      ),
    [branches, activeItem?.branchId],
  );

  const inventoryColumns: DataTableColumn<InventoryItem>[] = [
    {
      id: "product",
      header: "Product",
      cell: (i) => (
        <div>
          <div className="text-sm font-medium">{i.productName}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {i.sku}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "productName",
    },
    {
      id: "category",
      header: "Category",
      cell: (i) => <span className="text-sm">{i.categoryName}</span>,
      className: "hidden md:table-cell",
    },
    {
      id: "branch",
      header: "Branch",
      cell: (i) => <span className="text-sm">{i.branchName}</span>,
      className: "hidden lg:table-cell",
    },
    {
      id: "stock",
      header: "Stock",
      cell: (i) => (
        <div className="text-sm">
          <div className="font-medium">{formatNumber(i.currentStock)}</div>
          <div className="text-xs text-muted-foreground">
            Available {i.availableStock}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: "currentStock",
    },
    {
      id: "min",
      header: "Min",
      cell: (i) => <span className="text-sm">{i.minimumStock}</span>,
      className: "hidden md:table-cell",
    },
    {
      id: "status",
      header: "Status",
      cell: (i) => (
        <StatusBadge
          variant={getStatusVariant(i.status)}
          label={humanize(i.status)}
        />
      ),
    },
    {
      id: "updated",
      header: "Updated",
      cell: (i) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(i.updatedAt)}
        </span>
      ),
      className: "hidden xl:table-cell",
    },
    {
      id: "actions",
      header: "",
      className: "w-32",
      cell: (i) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!can("inventory.manage")}
          onClick={() => openAction(i)}
        >
          <Sliders className="h-3.5 w-3.5" />
          Adjust
        </Button>
      ),
    },
  ];

  const transactionColumns: DataTableColumn<InventoryTransaction>[] = [
    {
      id: "type",
      header: "Type",
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          {getTransactionIcon(t.type)}
          {humanize(t.type)}
        </span>
      ),
      sortable: true,
      sortKey: "type",
    },
    {
      id: "product",
      header: "Product",
      cell: (t) => (
        <div>
          <div className="text-sm font-medium">{t.productName}</div>
          <div className="text-xs text-muted-foreground">{t.branchName}</div>
        </div>
      ),
      sortable: true,
      sortKey: "productName",
    },
    {
      id: "qty",
      header: "Quantity",
      cell: (t) => (
        <span
          className={cn(
            "font-medium tabular-nums",
            t.quantity >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {t.quantity > 0 ? "+" : ""}
          {t.quantity}
        </span>
      ),
      sortable: true,
      sortKey: "quantity",
    },
    {
      id: "before",
      header: "Before",
      cell: (t) => <span className="text-sm">{t.previousStock}</span>,
      className: "hidden md:table-cell",
    },
    {
      id: "after",
      header: "After",
      cell: (t) => <span className="text-sm font-medium">{t.newStock}</span>,
      className: "hidden md:table-cell",
    },
    {
      id: "reason",
      header: "Reason",
      cell: (t) => (
        <div className="max-w-[260px] truncate text-sm" title={t.reason}>
          {t.reason}
        </div>
      ),
    },
    {
      id: "by",
      header: "By",
      cell: (t) => <span className="text-sm">{t.performedBy}</span>,
      className: "hidden lg:table-cell",
    },
    {
      id: "date",
      header: "Date",
      cell: (t) => (
        <span className="text-xs text-muted-foreground">
          {formatDateTime(t.date)}
        </span>
      ),
      sortable: true,
      sortKey: "date",
      className: "hidden lg:table-cell",
    },
  ];

  function openAction(item: InventoryItem) {
    setActiveItem(item);
    setActionType("stock_in");
    setQuantity("");
    setReason("");
    setActionError(null);
    setDestinationBranchId(
      branches.find(
        (branch) =>
          branch.status === "active" && branch.id !== item.branchId,
      )?.id ?? "",
    );
    setActionOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    const amount = Number(quantity);
    if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
      setActionError("Enter a whole number.");
      return;
    }
    if (actionType === "adjustment") {
      if (amount === 0) {
        setActionError("Adjustment cannot be zero.");
        return;
      }
    } else if (amount <= 0) {
      setActionError("Quantity must be greater than zero.");
      return;
    }
    if (actionType === "transfer") {
      if (!destinationBranchId) {
        setActionError("Select a destination branch.");
        return;
      }
      if (destinationBranchId === activeItem.branchId) {
        setActionError("Source and destination branches must differ.");
        return;
      }
    }
    if (actionType === "adjustment" && !reason.trim()) {
      setActionError("A reason is required for a stock adjustment.");
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      if (actionType === "stock_in") {
        await stockIn(activeItem.productId, activeItem.branchId, amount, reason);
      } else if (actionType === "stock_out") {
        await stockOut(activeItem.productId, activeItem.branchId, amount, reason);
      } else if (actionType === "adjustment") {
        await adjustStock(
          activeItem.productId,
          activeItem.branchId,
          amount,
          reason,
        );
      } else {
        await transferStock(
          activeItem.productId,
          activeItem.branchId,
          destinationBranchId,
          amount,
          reason,
        );
      }
      setActionOpen(false);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Could not update stock.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock levels, movements, and reservations across branches."
        breadcrumbs={[{ label: "Operations" }, { label: "Inventory" }]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatisticsCard
          label="Total units"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              formatNumber(summary.totalUnits)
            )
          }
          hint={`${summary.totalProducts} products tracked`}
          icon={<Boxes className="h-4 w-4" />}
        />
        <StatisticsCard
          label="Inventory value"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              formatCurrency(summary.inventoryValue)
            )
          }
          hint="At cost price"
          icon={<Banknote className="h-4 w-4" />}
        />
        <StatisticsCard
          label="Low stock"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              summary.lowStockCount + summary.criticalCount
            )
          }
          hint={`${summary.criticalCount} critical`}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatisticsCard
          label="Out of stock"
          value={
            summaryLoading ? (
              <Skeleton className="h-7 w-10" />
            ) : (
              summary.outOfStockCount
            )
          }
          hint="Needs restocking"
          icon={<PackageCheck className="h-4 w-4" />}
        />
      </div>

      {summary.alerts.length > 0 && (
        <Card className="border-warning/40 bg-warning/8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-warning">
              <AlertTriangle className="h-4 w-4" />
              Low-stock alerts
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter("low_stock")}
            >
              View low stock
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.alerts.slice(0, 3).map((alert) => (
              <div
                key={`${alert.productId}-${alert.branchId}`}
                className="flex flex-wrap items-center justify-between gap-2 text-xs text-warning"
              >
                <span className="font-medium">
                  {alert.productName}{" "}
                  <span className="font-mono text-xs opacity-70">
                    {alert.sku}
                  </span>
                </span>
                <span>
                  {alert.currentStock} left · min {alert.minimumStock}
                </span>
              </div>
            ))}
            {summary.alerts.length > 3 && (
              <p className="text-xs text-warning">
                +{summary.alerts.length - 3} more product(s) need attention.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">
            <Boxes className="h-3.5 w-3.5" />
            Stock Levels
          </TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <DataTable<InventoryItem>
            data={items}
            columns={inventoryColumns}
            loading={loading}
            error={error ?? summaryError}
            onRetry={() => void refresh()}
            searchPlaceholder="Search by product, SKU, branch…"
            rowKey={(i) => i.id}
            serverMode={{
              search: filters.search,
              onSearchChange: setSearch,
              page,
              pageSize,
              total,
              onPageChange: setPage,
              onPageSizeChange: setPageSize,
            }}
            emptyState={
              <EmptyState
                title={filters.search ||
                filters.categoryId !== "all" ||
                filters.branchId !== "all" ||
                filters.status !== "all"
                ? "No stock records match your filters"
                : "No stock records yet"}
                description="Add a product to start tracking its inventory."
              />
            }
            toolbar={
              <>
                <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select
                  value={filters.categoryId}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger aria-label="Filter by category" className="h-9 w-full sm:w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger aria-label="Filter by status" className="h-9 w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.branchId}
                  onValueChange={setBranchFilter}
                >
                  <SelectTrigger aria-label="Filter by branch" className="h-9 w-full sm:w-[180px]">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
          />
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Stock Movements</CardTitle>
              <div className="text-xs text-muted-foreground">
                {transactionLoading
                  ? "Loading…"
                  : `${transactionTotal} transaction(s)`}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {transactionError && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <span>{transactionError}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refreshTransactions()}
                  >
                    Retry
                  </Button>
                </div>
              )}
              <DataTable<InventoryTransaction>
                data={transactions}
                columns={transactionColumns}
                loading={transactionLoading}
                searchPlaceholder="Search transactions..."
                rowKey={(t) => t.id}
                serverMode={{
                  search: transactionFilters.search,
                  onSearchChange: setTransactionSearch,
                  page: transactionPage,
                  pageSize: transactionPageSize,
                  total: transactionTotal,
                  onPageChange: setTransactionPage,
                  onPageSizeChange: setTransactionPageSize,
                }}
                emptyState={
                  <EmptyState
                    title="No transactions match your filters"
                    description="Stock movements will appear here as inventory changes."
                  />
                }
                toolbar={
                  <>
                    <Select
                      value={transactionFilters.type}
                      onValueChange={setTransactionTypeFilter}
                    >
                      <SelectTrigger aria-label="Filter by type" className="h-9 w-full sm:w-[170px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="STOCK_IN">Stock In</SelectItem>
                        <SelectItem value="STOCK_OUT">Stock Out</SelectItem>
                        <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        <SelectItem value="TRANSFER">Transfer</SelectItem>
                        <SelectItem value="RESERVATION">Reservation</SelectItem>
                        <SelectItem value="RELEASE">Release</SelectItem>
                        <SelectItem value="ORDER_COMMIT">Order Commit</SelectItem>
                        <SelectItem value="ORDER_RELEASE">Order Release</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={transactionFilters.branchId}
                      onValueChange={setTransactionBranchFilter}
                    >
                      <SelectTrigger aria-label="Filter by branch" className="h-9 w-full sm:w-[180px]">
                        <SelectValue placeholder="Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All branches</SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={actionOpen}
        onOpenChange={(open) => {
          if (!submitting) setActionOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "stock_in" && "Stock In"}
              {actionType === "stock_out" && "Stock Out"}
              {actionType === "adjustment" && "Adjust Stock"}
              {actionType === "transfer" && "Transfer Stock"}
            </DialogTitle>
            <DialogDescription>
              {activeItem?.productName} · {activeItem?.branchName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {actionError && (
              <Alert variant="destructive">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "stock_in", label: "Stock In" },
                  { value: "stock_out", label: "Stock Out" },
                  { value: "adjustment", label: "Adjust" },
                  { value: "transfer", label: "Transfer" },
                ] as { value: StockAction; label: string }[]
              ).map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={actionType === option.value ? "default" : "outline"}
                  size="sm"
                  aria-pressed={actionType === option.value}
                  onClick={() => {
                    setActionType(option.value);
                    setActionError(null);
                    setQuantity("");
                  }}
                  disabled={submitting}
                >
                  {option.label}
                </Button>
              ))}
            </div>
            {actionType === "transfer" && (
              <div className="space-y-1.5">
                <Label htmlFor="destination-branch">Destination branch</Label>
                <Select
                  value={destinationBranchId}
                  onValueChange={setDestinationBranchId}
                >
                  <SelectTrigger id="destination-branch" className="h-9">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="qty">
                {actionType === "adjustment"
                  ? "Adjustment (can be negative)"
                  : "Quantity"}
              </Label>
              <Input
                id="qty"
                type="number"
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={submitting}
                className="h-9"
              />
              {activeItem && (
                <p className="text-xs text-muted-foreground">
                  Current: {activeItem.currentStock} · Minimum:{" "}
                  {activeItem.minimumStock}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">
                Reason {actionType === "adjustment" && "*"}
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Why this stock movement is needed…"
                disabled={submitting}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTransactionIcon(type: TransactionType) {
  if (type === "stock_in" || type === "order_release")
    return <ArrowDownCircle className="h-4 w-4 text-success" aria-hidden />;
  if (type === "stock_out" || type === "order_commit")
    return <ArrowUpCircle className="h-4 w-4 text-destructive" aria-hidden />;
  if (type === "transfer")
    return <ArrowLeftRight className="h-4 w-4 text-info" aria-hidden />;
  if (type === "reservation")
    return <Boxes className="h-4 w-4 text-warning" aria-hidden />;
  if (type === "release")
    return <Boxes className="h-4 w-4 text-success" aria-hidden />;
  return <Truck className="h-4 w-4 text-muted-foreground" aria-hidden />;
}
