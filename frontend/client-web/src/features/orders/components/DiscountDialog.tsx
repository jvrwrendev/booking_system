import { useEffect, useState } from "react";
import { BadgePercent, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

const REASON_OPTIONS = [
  { value: "none", label: "No reason" },
  { value: "loyalty", label: "Loyalty promo" },
  { value: "damaged", label: "Damaged item" },
  { value: "bulk", label: "Bulk order" },
  { value: "clearance", label: "Seasonal clearance" },
  { value: "custom", label: "Custom reason..." },
];

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  currentDiscount: number;
  onSave: (discount: number, note: string) => void;
}

export function DiscountDialog({
  open,
  onOpenChange,
  subtotal,
  currentDiscount,
  onSave,
}: DiscountDialogProps) {
  const [value, setValue] = useState("");
  const [reasonType, setReasonType] = useState("none");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(currentDiscount > 0 ? String(currentDiscount) : "");
      setReasonType("none");
      setNote("");
      setError(null);
    }
  }, [open, currentDiscount]);

  const raw = value.trim();
  const parsed = raw === "" ? 0 : Number(value);
  const valid =
    raw !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed <= subtotal;
  const newTotal = Math.max(0, subtotal - parsed);

  const handleReasonChange = (v: string) => {
    setReasonType(v);
    if (v === "none") {
      setNote("");
    } else if (v !== "custom") {
      const preset = REASON_OPTIONS.find((o) => o.value === v);
      setNote(preset ? preset.label : "");
    }
  };

  const handleSave = () => {
    if (!valid) {
      setError(
        raw === "" || parsed < 0
          ? "Enter a discount amount greater than or equal to 0."
          : `Discount cannot exceed the subtotal of ${formatCurrency(subtotal)}.`
      );
      return;
    }
    onSave(parsed, note.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgePercent className="h-5 w-5 text-primary" />
            {currentDiscount > 0 ? "Edit discount" : "Add discount"}
          </DialogTitle>
          <DialogDescription>
            Apply a discount to the order total. The new total is recalculated
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="discount-amount">Discount amount</Label>
            <Input
              id="discount-amount"
              type="number"
              min={0}
              max={subtotal}
              step={0.01}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              inputMode="decimal"
              className="h-10"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-reason">Reason</Label>
            <Select value={reasonType} onValueChange={handleReasonChange}>
              <SelectTrigger id="discount-reason" className="h-10">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reasonType === "custom" && (
              <Input
                id="discount-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type your own reason"
                className="h-10"
              />
            )}
          </div>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-muted-foreground">
              <span>Discount</span>
              <span>−{formatCurrency(parsed)}</span>
            </div>
            <Separator className="my-1.5" />
            <div className="flex items-center justify-between gap-2 font-medium">
              <span>New total</span>
              <span>{formatCurrency(newTotal)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!valid} className="gap-2">
            <Tag className="h-4 w-4" />
            {currentDiscount > 0 ? "Update discount" : "Apply discount"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}