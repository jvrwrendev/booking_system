import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowLeftRight,
  ArrowUpCircle,
  Boxes,
  Filter,
  Sliders,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type DataTableColumn } from "@/components/common/DataTable";
import {
  StatusBadge,
  getStockStatusVariant,
  humanize,
} from "@/components/common/StatusBadge";
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

import {
  mockInventory,
  mockTransactions,
} from "@/data/mock-inventory";
import type {
  InventoryItem,
  InventoryTransaction,
  TransactionType,
} from "@/types/inventory";
import { mockBranches } from "@/data/mock-branches";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

type StockAction = "stock_in" | "stock_out" | "adjustment" | "transfer";

export function InventoryPage() {
  const { can } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<StockAction>("stock_in");
  const [items, setItems] = useState<InventoryItem[]>(mockInventory);
  const [transactions, setTransactions] =
    useState<InventoryTransaction[]>(mockTransactions);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>("");

  const filteredInventory = useMemo(() => {
    return items.filter((i) => {
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (branchFilter !== "all" && i.branchId !== branchFilter) return false;
      return true;
    });
  }, [items, statusFilter, branchFilter]);

  const inventoryColumns: DataTableColumn<InventoryItem>[] = [
    {
      id: "product",
      header: "Product",
      cell: (i) => (
        <div>
          <div className="text-sm font-medium">{i.productName}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
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
          <div className="text-[11px] text-muted-foreground">
            Reserved {i.reservedStock} · Avail {i.availableStock}
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
          variant={getStockStatusVariant(i.status)}
          label={humanize(i.status)}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      className: "w-40",
      cell: (i) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!can("inventory.manage")}
          onClick={() => {
            setActiveItem(i);
            setActionType("stock_in");
            setQuantity(0);
            setReason("");
            setActionOpen(true);
          }}
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
          <div className="text-[11px] text-muted-foreground">{t.branchName}</div>
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
          className={
            t.quantity >= 0 ? "font-medium text-emerald-600" : "font-medium text-rose-600"
          }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    if (quantity <= 0 && actionType !== "adjustment") {
      toast.error("Quantity must be greater than zero.");
      return;
    }
    let newQty = activeItem.currentStock;
    if (actionType === "stock_in") newQty = activeItem.currentStock + quantity;
    if (actionType === "stock_out")
      newQty = Math.max(0, activeItem.currentStock - quantity);
    if (actionType === "adjustment") newQty = activeItem.currentStock + quantity;
    if (actionType === "transfer") newQty = Math.max(0, activeItem.currentStock - quantity);

    const transaction: InventoryTransaction = {
      id: `TXN-${Date.now()}`,
      productId: activeItem.productId,
      productName: activeItem.productName,
      branchId: activeItem.branchId,
      branchName: activeItem.branchName,
      type: actionType,
      quantity:
        actionType === "stock_out" || actionType === "transfer"
          ? -quantity
          : actionType === "adjustment"
          ? quantity
          : quantity,
      previousStock: activeItem.currentStock,
      newStock: newQty,
      reason: reason || "Manual adjustment",
      performedBy: "Admin",
      date: new Date().toISOString(),
    };

    setItems((prev) =>
      prev.map((i) =>
        i.id === activeItem.id
          ? {
              ...i,
              currentStock: newQty,
              availableStock: Math.max(0, newQty - i.reservedStock),
              status:
                newQty <= 0
                  ? "out_of_stock"
                  : newQty <= Math.max(activeItem.minimumStock / 2, 1)
                  ? "critical"
                  : newQty <= activeItem.minimumStock
                  ? "low_stock"
                  : "in_stock",
            }
          : i
      )
    );
    setTransactions((prev) => [transaction, ...prev]);
    toast.success("Stock updated", {
      description: `${humanize(actionType)} recorded for ${activeItem.productName}.`,
    });
    setActionOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Track stock levels, movements, and reservations across branches."
        breadcrumbs={[{ label: "Operations" }, { label: "Inventory" }]}
      />

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
            data={filteredInventory}
            columns={inventoryColumns}
            searchPlaceholder="Search by product, SKU, branch..."
            searchKeys={["productName", "sku", "branchName", "categoryName"]}
            rowKey={(i) => i.id}
            toolbar={
              <>
                <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[150px]">
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
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    {mockBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
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
              <CardTitle>Recent Transactions</CardTitle>
              <div className="text-xs text-muted-foreground">
                Showing stock movements and adjustments
              </div>
            </CardHeader>
            <CardContent>
              <DataTable<InventoryTransaction>
                data={transactions}
                columns={transactionColumns}
                searchPlaceholder="Search transactions..."
                searchKeys={["productName", "branchName", "reason", "performedBy"]}
                rowKey={(t) => t.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
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
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "stock_in", label: "Stock In" },
                  { value: "stock_out", label: "Stock Out" },
                  { value: "adjustment", label: "Adjust" },
                  { value: "transfer", label: "Transfer" },
                ] as { value: StockAction; label: string }[]
              ).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={actionType === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActionType(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qty">
                {actionType === "adjustment" ? "Adjustment (can be negative)" : "Quantity"}
              </Label>
              <Input
                id="qty"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
              />
              {activeItem && (
                <p className="text-[11px] text-muted-foreground">
                  Current: {activeItem.currentStock}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Why this adjustment is needed..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getTransactionIcon(type: TransactionType) {
  if (type === "stock_in") return <ArrowDownCircle className="h-4 w-4 text-emerald-600" />;
  if (type === "stock_out") return <ArrowUpCircle className="h-4 w-4 text-rose-600" />;
  if (type === "transfer") return <ArrowLeftRight className="h-4 w-4 text-sky-600" />;
  if (type === "reservation") return <Boxes className="h-4 w-4 text-amber-600" />;
  if (type === "release") return <Boxes className="h-4 w-4 text-emerald-600" />;
  return <Truck className="h-4 w-4 text-muted-foreground" />;
}