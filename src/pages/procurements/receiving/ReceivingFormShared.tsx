import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
export interface ReceivingMaterialRow {
  id: string;
  materialId: string;
  name: string;
  unit: string;
  orderedQty: number;
  acceptedQty: number;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  taxPercent: number;
  lineTotal: number;
  taxAmount: number;
  totalLineAmount: number;
  hasError: boolean;
  errorMessage: string;
  shortReason: string;
  shortRemarks: string;
}

export function createEmptyRow(
  overrides: Partial<ReceivingMaterialRow> & { id: string; materialId: string; name: string; unit: string }
): ReceivingMaterialRow {
  return {
    orderedQty: 0,
    acceptedQty: 0,
    poUnitPrice: 0,
    invoiceUnitPrice: 0,
    taxPercent: 0,
    lineTotal: 0,
    taxAmount: 0,
    totalLineAmount: 0,
    hasError: false,
    errorMessage: "",
    shortReason: "",
    shortRemarks: "",
    ...overrides,
  };
}

export function recalcRow(row: ReceivingMaterialRow, isPO: boolean): ReceivingMaterialRow {
  const lineTotal = row.acceptedQty * row.invoiceUnitPrice;
  const taxAmount = lineTotal * (row.taxPercent / 100);
  const totalLineAmount = lineTotal + taxAmount;
  const hasError = isPO && row.acceptedQty > row.orderedQty;
  const errorMessage = hasError ? "Accepted quantity cannot exceed ordered quantity." : "";
  return { ...row, lineTotal, taxAmount, totalLineAmount, hasError, errorMessage };
}

// --- Short Supply Reasons ---
export const SHORT_SUPPLY_REASONS = [
  "Short Supply",
  "Damaged",
  "Expired",
  "Quality Issue",
  "Other",
];

// --- Mismatch Reasons ---
export const MISMATCH_REASONS = [
  "Price variance",
  "Tax difference",
  "Freight / Additional charges",
  "Rounding difference",
  "Vendor billing error",
  "Other",
];

// --- Short Supply Section ---
interface ShortSupplySectionProps {
  materials: ReceivingMaterialRow[];
  onUpdate: (id: string, updates: Partial<ReceivingMaterialRow>) => void;
  readOnly?: boolean;
}

export function ShortSupplySection({ materials, onUpdate, readOnly }: ShortSupplySectionProps) {
  const shortItems = materials.filter((m) => m.acceptedQty < m.orderedQty && m.orderedQty > 0);
  if (shortItems.length === 0) return null;

  return (
    <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-foreground">Short Supply Details</h3>
      </div>
      <div className="space-y-4">
        {shortItems.map((item) => {
          const shortQty = item.orderedQty - item.acceptedQty;
          const isOther = item.shortReason === "Other";
          return (
            <div key={item.id} className="bg-background/80 rounded-lg border border-border/60 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  Ordered: <span className="font-medium text-foreground">{item.orderedQty}</span>
                  {" · "}
                  Accepted: <span className="font-medium text-foreground">{item.acceptedQty}</span>
                  {" · "}
                  Short: <span className="font-semibold text-amber-700">{shortQty}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Reason <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={item.shortReason}
                    onValueChange={(v) => onUpdate(item.id, { shortReason: v })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className={cn("bg-card text-sm", !item.shortReason && "text-muted-foreground")}>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHORT_SUPPLY_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">
                    Remarks {isOther && <span className="text-destructive">*</span>}
                  </label>
                  <Input
                    value={item.shortRemarks}
                    onChange={(e) => onUpdate(item.id, { shortRemarks: e.target.value })}
                    disabled={readOnly}
                    placeholder={isOther ? "Required for 'Other'" : "Optional"}
                    className={cn("bg-card text-sm", isOther && !item.shortRemarks.trim() && "border-destructive")}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- PO Summary Block ---
interface POSummaryBlockProps {
  totalAccepted: number;
  poTotal: number;
  invoiceSubtotal: number;
  totalTax: number;
  grandTotal: number;
}

export function POSummaryBlock({ totalAccepted, poTotal, invoiceSubtotal, totalTax, grandTotal }: POSummaryBlockProps) {
  return (
    <div className="bg-muted/30 rounded-xl border border-border p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Receiving Summary</h3>
      <div className="grid grid-cols-5 gap-4">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Total Accepted</p>
          <p className="text-lg font-semibold text-foreground">{totalAccepted}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">PO Total</p>
          <p className="text-lg font-medium text-muted-foreground">₹{poTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Invoice Subtotal</p>
          <p className="text-lg font-medium text-foreground">₹{invoiceSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Total Tax</p>
          <p className="text-lg font-medium text-foreground">₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-cento-yellow-tint rounded-lg p-3 -m-1">
          <p className="text-[11px] text-muted-foreground mb-1">Grand Total</p>
          <p className="text-xl font-bold text-foreground">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}

// --- Direct Summary Block ---
interface DirectSummaryBlockProps {
  invoiceSubtotal: number;
  totalTax: number;
  grandTotal: number;
}

export function DirectSummaryBlock({ invoiceSubtotal, totalTax, grandTotal }: DirectSummaryBlockProps) {
  return (
    <div className="bg-muted/30 rounded-xl border border-border p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Receiving Summary</h3>
      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Invoice Subtotal</p>
          <p className="text-lg font-medium text-foreground">₹{invoiceSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">Total Tax</p>
          <p className="text-lg font-medium text-foreground">₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-cento-yellow-tint rounded-lg p-3 -m-1">
          <p className="text-[11px] text-muted-foreground mb-1">Grand Total</p>
          <p className="text-xl font-bold text-foreground">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}

// --- Mismatch Modal ---
interface MismatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poTotal: number;
  invoiceTotal: number;
  reason: string;
  remarks: string;
  onReasonChange: (v: string) => void;
  onRemarksChange: (v: string) => void;
  onConfirm: () => void;
}

export function MismatchModal({
  open, onOpenChange, poTotal, invoiceTotal, reason, remarks, onReasonChange, onRemarksChange, onConfirm,
}: MismatchModalProps) {
  const diff = invoiceTotal - poTotal;
  const isOther = reason === "Other";
  const canConfirm = !!reason && (!isOther || remarks.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Invoice Amount Mismatch</DialogTitle>
          <DialogDescription>
            The invoice total differs from the PO total. Please select the reason for the mismatch to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3 bg-muted/40 rounded-lg p-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">PO Total</p>
              <p className="font-medium">₹{poTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Invoice Total</p>
              <p className="font-medium">₹{invoiceTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-0.5">Difference</p>
              <p className={cn("font-semibold", diff > 0 ? "text-destructive" : "text-emerald-600")}>
                {diff > 0 ? "+" : ""}₹{diff.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">
              Reason for Mismatch <span className="text-destructive">*</span>
            </label>
            <Select value={reason} onValueChange={onReasonChange}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {MISMATCH_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isOther && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">
                Remarks <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                placeholder="Explain the mismatch..."
                className="min-h-[60px] text-sm resize-none bg-card"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Back to Edit</Button>
          <Button variant="cento" disabled={!canConfirm} onClick={onConfirm}>Confirm & Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
