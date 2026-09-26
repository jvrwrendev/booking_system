import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { NotFound } from "@/components/common/NotFound";

import { useBookingsStore } from "../hooks/useBookingsStore";
import { useBookingDraft } from "../hooks/useBookingDraft";
import { BookingProductPicker } from "../components/BookingProductPicker";
import { useCustomersStore } from "@/features/customers/hooks/useCustomersStore";
import { useAgentsStore } from "@/features/agents/hooks/useAgentsStore";
import { useBranchesStore } from "@/features/branches/hooks/useBranchesStore";
import { useProductsStore } from "@/features/products/hooks/useProductsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/types/product";

type Errors = Partial<
  Record<"customerId" | "agentId" | "branchId" | "bookingDate" | "pickupDate" | "items", string>
>;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingAddPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { addBooking } = useBookingsStore();
  const { getAvailableStock } = useProductsStore();
  const { customers } = useCustomersStore();
  const { agents } = useAgentsStore();
  const { branches } = useBranchesStore();
  const draft = useBookingDraft();

  const [customerId, setCustomerId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [bookingDate, setBookingDate] = useState(today);
  const [pickupDate, setPickupDate] = useState(today);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const activeCustomers = useMemo(
    () => customers.filter((c) => c.status === "active"),
    [customers]
  );
  const activeAgents = useMemo(
    () => agents.filter((a) => a.status === "active"),
    [agents]
  );
  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === "active"),
    [branches]
  );

  const totalAmount = Math.max(0, draft.subtotal - discount);

  if (!can("bookings.create")) {
    return <NotFound permission title="Permission denied" />;
  }

  const addProduct = (product: Product, quantity: number) => {
    draft.addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.sellingPrice,
      subtotal: product.sellingPrice * quantity,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!customerId) next.customerId = "Select a customer.";
    if (!agentId) next.agentId = "Select an agent.";
    if (!branchId) next.branchId = "Select a branch.";
    if (!bookingDate) next.bookingDate = "Booking date is required.";
    if (!pickupDate) next.pickupDate = "Pickup date is required.";
    if (bookingDate && pickupDate && pickupDate < bookingDate) {
      next.pickupDate = "Pickup date cannot be before the booking date.";
    }
    if (draft.items.length === 0) {
      next.items = "Add at least one product to the booking.";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});

    const customer = customers.find((c) => c.id === customerId);
    const agent = agents.find((a) => a.id === agentId);
    const branch = branches.find((b) => b.id === branchId);

    const result = addBooking({
      customerId,
      customerName: customer?.fullName ?? "Unknown customer",
      agentId,
      agentName: agent?.fullName ?? "Unknown agent",
      branchId,
      branchName: branch?.name ?? "Unknown branch",
      bookingDate,
      pickupDate,
      items: draft.items,
      discount,
      notes: notes.trim() || undefined,
    });

    if (!result.ok) {
      setErrors({ items: result.error });
      return;
    }
    navigate(`/bookings/${result.booking.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader
        title="New booking"
        description="Create a customer booking. Stock is deducted once an admin accepts it."
        breadcrumbs={[
          { label: "Bookings", href: "/bookings" },
          { label: "New" },
        ]}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/bookings")}
            >
              Cancel
            </Button>
            <Button type="submit">Create booking</Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Booking details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="customer">
              Customer <span className="text-primary">*</span>
            </Label>
            <Select
              value={customerId}
              onValueChange={(v) => {
                setCustomerId(v);
                setErrors((p) => ({ ...p, customerId: undefined }));
              }}
            >
              <SelectTrigger id="customer">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {activeCustomers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-xs text-destructive">{errors.customerId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agent">
              Agent <span className="text-primary">*</span>
            </Label>
            <Select
              value={agentId}
              onValueChange={(v) => {
                setAgentId(v);
                setErrors((p) => ({ ...p, agentId: undefined }));
              }}
            >
              <SelectTrigger id="agent">
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {activeAgents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.agentId && (
              <p className="text-xs text-destructive">{errors.agentId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="branch">
              Branch <span className="text-primary">*</span>
            </Label>
            <Select
              value={branchId}
              onValueChange={(v) => {
                setBranchId(v);
                setErrors((p) => ({ ...p, branchId: undefined }));
              }}
            >
              <SelectTrigger id="branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {activeBranches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.branchId && (
              <p className="text-xs text-destructive">{errors.branchId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bookingDate">
              Booking date <span className="text-primary">*</span>
            </Label>
            <Input
              id="bookingDate"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
            {errors.bookingDate && (
              <p className="text-xs text-destructive">{errors.bookingDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pickupDate">
              Pickup date <span className="text-primary">*</span>
            </Label>
            <Input
              id="pickupDate"
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
            {errors.pickupDate && (
              <p className="text-xs text-destructive">{errors.pickupDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={1}
              placeholder="Optional instructions..."
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Products <span className="text-primary">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BookingProductPicker
            quantityByProduct={draft.quantityByProduct}
            onAdd={addProduct}
          />
          {errors.items && (
            <p className="text-xs text-destructive">{errors.items}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          {draft.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="w-[130px] text-right">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.items.map((item) => {
                  const available = getAvailableStock(item.productId);
                  return (
                  <TableRow key={item.productId}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {item.productName}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={1}
                        max={available}
                        value={item.quantity}
                        onChange={(e) => {
                          const typed = Math.max(
                            1,
                            Number(e.target.value) || 1
                          );
                          // Clamped to live stock so the table cannot be used to
                          // order more units than the catalog can fulfill. Never
                          // clamped to 0, which the draft reads as "remove this
                          // line" and would drop the row mid-keystroke.
                          const capped = Math.max(1, Math.min(typed, available));
                          if (capped < typed) {
                            toast.error(
                              `Only ${available} unit${
                                available === 1 ? "" : "s"
                              } of ${item.productName} available.`
                            );
                          }
                          draft.setQuantity(item.productId, capped);
                        }}
                        className="h-8 w-24 text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => draft.removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="ml-auto w-full max-w-xs space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total quantity</span>
              <span className="font-medium tabular-nums">
                {draft.totalQuantity}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(draft.subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <Label htmlFor="discount" className="text-muted-foreground">
                Discount
              </Label>
              <Input
                id="discount"
                type="number"
                min={0}
                value={discount || ""}
                onChange={(e) =>
                  setDiscount(Math.max(0, Number(e.target.value) || 0))
                }
                className="h-8 w-28 text-right"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-2.5 text-base">
              <span className="font-medium">Total amount</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            This booking is created as pending. Stock is deducted from the
            catalog when it moves to admin accepted, and returned if it is later
            cancelled or rejected.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
