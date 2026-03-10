import React, { useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Search, CalendarIcon, Plus, X, Trash2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { POSummaryBlock } from "./ReceivingFormShared";
import { toast } from "@/hooks/use-toast";
import type { OrderRow, ReceivingEntry } from "../Receivings";

/* ─── Mock order lookup ─── */
const MOCK_ORDERS: OrderRow[] = [
  {
    id: "or1", orderId: "PO-1010", orderType: "Vendor", supplier: "Sysco Foods", outlet: "Main Kitchen",
    orderedAt: "2026-02-15", expectedDelivery: "2026-02-25", orderedQty: 200, receivedQty: 0, pendingQty: 200, orderAmount: 38000,
    receivings: [],
  },
  {
    id: "or2", orderId: "PO-1005", orderType: "Vendor", supplier: "US Foods", outlet: "Main Kitchen",
    orderedAt: "2026-01-20", expectedDelivery: "2026-02-01", orderedQty: 500, receivedQty: 200, pendingQty: 300, orderAmount: 72000,
    receivings: [],
  },
  {
    id: "or3", orderId: "PO-1008", orderType: "Outlet", supplier: "Fresh Direct", outlet: "Central Warehouse",
    orderedAt: "2026-01-08", expectedDelivery: "2026-02-03", orderedQty: 150, receivedQty: 90, pendingQty: 60, orderAmount: 22500,
    receivings: [],
  },
  {
    id: "or4", orderId: "TO-2005", orderType: "Transfer", supplier: "Main Kitchen", outlet: "Central Warehouse",
    orderedAt: "2026-01-28", expectedDelivery: "2026-02-05", orderedQty: 100, receivedQty: 60, pendingQty: 40, orderAmount: 18000,
    receivings: [],
  },
];

const MOCK_TAX_TYPES = [
  { id: "t1", name: "GST", rate: 18 },
  { id: "t2", name: "IGST", rate: 18 },
  { id: "t3", name: "SGST", rate: 9 },
  { id: "t4", name: "CGST", rate: 9 },
];

const MOCK_OTHER_CHARGE_REASONS = [
  "Freight Charges", "Packaging Charges", "Inspection Fee", "Loading / Unloading", "Insurance", "Handling Charges", "Other",
];

const SHORT_SUPPLY_REASONS = ["Short Supply", "Damaged", "Expired", "Quality Issue", "Other"];

const MOCK_MATERIALS = [
  { id: "m1", code: "RM-001", name: "Basmati Rice", unit: "KG", ordered: 100, pending: 80, unitPrice: 220, defaultTax: { name: "GST", rate: 5 } },
  { id: "m2", code: "RM-002", name: "Sunflower Oil", unit: "LTR", ordered: 30, pending: 25, unitPrice: 350, defaultTax: { name: "GST", rate: 18 } },
  { id: "m3", code: "RM-003", name: "Wheat Flour", unit: "KG", ordered: 40, pending: 40, unitPrice: 75, defaultTax: { name: "CGST", rate: 9 } },
  { id: "m4", code: "RM-004", name: "Olive Oil", unit: "LTR", ordered: 25, pending: 20, unitPrice: 480, defaultTax: { name: "SGST", rate: 9 } },
  { id: "m5", code: "RM-005", name: "Chicken Breast", unit: "KG", ordered: 100, pending: 50, unitPrice: 240, defaultTax: { name: "IGST", rate: 18 } },
];

interface TaxEntry { id: string; taxTypeId: string; taxName: string; taxRate: number; }

interface MaterialRow {
  id: string; materialId: string; code: string; name: string; unit: string;
  orderedQty: number; pendingQty: number; acceptedQty: number; batchName: string;
  poUnitPrice: number; invoiceUnitPrice: number;
  taxes: TaxEntry[]; totalTaxAmount: number; lineTotal: number; totalLineAmount: number;
  hasError: boolean; shortReason: string; shortRemarks: string;
  wastageQty: number; wastageError: boolean;
}

interface OtherCharge { id: string; reason: string; value: number; taxes: TaxEntry[]; }

function recalcRow(row: MaterialRow): MaterialRow {
  const lineTotal = row.acceptedQty * row.invoiceUnitPrice;
  const totalTaxPct = row.taxes.reduce((s, t) => s + t.taxRate, 0);
  const totalTaxAmount = lineTotal * (totalTaxPct / 100);
  const totalLineAmount = lineTotal + totalTaxAmount;
  const hasError = row.acceptedQty > row.pendingQty;
  return { ...row, lineTotal, totalTaxAmount, totalLineAmount, hasError };
}

export default function ReceiveOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id);

  const [receivingDate, setReceivingDate] = useState<Date>(new Date());
  const [materials, setMaterials] = useState<MaterialRow[]>(() =>
    MOCK_MATERIALS.slice(0, 3).map((m) => recalcRow({
      id: crypto.randomUUID(), materialId: m.id, code: m.code, name: m.name, unit: m.unit,
      orderedQty: m.ordered, pendingQty: m.pending, acceptedQty: m.pending, batchName: "",
      poUnitPrice: m.unitPrice, invoiceUnitPrice: m.unitPrice,
      taxes: [{ id: crypto.randomUUID(), taxTypeId: "", taxName: m.defaultTax.name, taxRate: m.defaultTax.rate }],
      totalTaxAmount: 0, lineTotal: 0, totalLineAmount: 0,
      hasError: false, shortReason: "", shortRemarks: "",
      wastageQty: 0, wastageError: false,
    }))
  );
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);
  const [chargeSearch, setChargeSearch] = useState("");
  const [chargeSearchFocused, setChargeSearchFocused] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [taxModal, setTaxModal] = useState<{ rowId: string; type: "material" | "charge" } | null>(null);
  const [taxModalTypeId, setTaxModalTypeId] = useState("");

  const receivingId = useMemo(() => "GRN-2026-" + String(Math.floor(Math.random() * 900) + 100), []);

  const updateMaterial = useCallback((id: string, updates: Partial<MaterialRow>) => {
    setMaterials((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, ...updates };
      // Check excess: if acceptedQty > pendingQty, show error via toast and revert
      if (updates.acceptedQty !== undefined && updates.acceptedQty > r.pendingQty) {
        toast({
          title: "Excess Quantity",
          description: `Accepted quantity cannot exceed pending quantity (${r.pendingQty} ${r.unit}) for ${r.name}.`,
          variant: "destructive",
        });
        return r;
      }
      return recalcRow(updated);
    }));
  }, []);

  const addTaxToRow = () => {
    if (!taxModal || !taxModalTypeId) return;
    const tax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId);
    if (!tax) return;
    if (taxModal.type === "material") {
      setMaterials((prev) => prev.map((r) => {
        if (r.id !== taxModal.rowId) return r;
        if (r.taxes.some((t) => t.taxTypeId === taxModalTypeId)) return r;
        return recalcRow({ ...r, taxes: [...r.taxes, { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate }] });
      }));
    } else {
      setOtherCharges((prev) => prev.map((c) => {
        if (c.id !== taxModal.rowId) return c;
        if (c.taxes.some((t) => t.taxTypeId === taxModalTypeId)) return c;
        return { ...c, taxes: [...c.taxes, { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate }] };
      }));
    }
    setTaxModal(null);
    setTaxModalTypeId("");
  };

  const addOtherCharge = (reason: string) => {
    setOtherCharges((prev) => [...prev, { id: crypto.randomUUID(), reason, value: 0, taxes: [] }]);
    setChargeSearch("");
  };

  const filteredReasons = useMemo(() => {
    if (!chargeSearch.trim()) return MOCK_OTHER_CHARGE_REASONS;
    return MOCK_OTHER_CHARGE_REASONS.filter((r) => r.toLowerCase().includes(chargeSearch.toLowerCase()));
  }, [chargeSearch]);

  const totals = useMemo(() => {
    const totalAccepted = materials.reduce((s, r) => s + r.acceptedQty, 0);
    const poTotal = materials.reduce((s, r) => s + r.pendingQty * r.poUnitPrice, 0);
    const invoiceSubtotal = materials.reduce((s, r) => s + r.lineTotal, 0);
    const totalTax = materials.reduce((s, r) => s + r.totalTaxAmount, 0);
    const grandTotal = invoiceSubtotal + totalTax;
    return { totalAccepted, poTotal, invoiceSubtotal, totalTax, grandTotal };
  }, [materials]);

  const shortItems = materials.filter((m) => m.acceptedQty < m.pendingQty);
  const isOutletOrTransfer = order?.orderType === "Outlet" || order?.orderType === "Transfer";

  const canSubmit = useMemo(() => {
    if (!materials.some((r) => r.acceptedQty > 0) || materials.length === 0 || materials.some((r) => r.hasError)) return false;
    // All short items must have a reason
    const shorts = materials.filter((m) => m.acceptedQty < m.pendingQty);
    if (shorts.some((s) => !s.shortReason)) return false;
    // For Outlet/Transfer, wastageQty must be explicitly set (not blank) and valid
    if (isOutletOrTransfer && shorts.some((s) => s.wastageError || (s.acceptedQty + s.wastageQty) > s.pendingQty)) return false;
    return true;
  }, [materials, isOutletOrTransfer]);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/procurements/receivings")}>Go Back</Button>
      </div>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4 -mx-1 px-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/procurements/receivings")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-semibold">Receive Order</h1>
            <span className="text-xs text-muted-foreground font-mono">{receivingId}</span>
            <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">Draft</Badge>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs bg-card font-normal">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {format(receivingDate, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="single" selected={receivingDate} onSelect={(d) => d && setReceivingDate(d)} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto pb-32 max-w-6xl">
        {/* Order Details K-V */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Order Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KV label="Order ID" value={order.orderId} />
            <KV label="Order Type" value={order.orderType} />
            <KV label="Supplier" value={order.supplier} />
            <KV label="Outlet" value={order.outlet} />
            <KV label="Ordered At" value={format(new Date(order.orderedAt), "dd MMM yyyy")} />
            <KV label="Expected Delivery" value={format(new Date(order.expectedDelivery), "dd MMM yyyy")} />
            <KV label="Ordered Qty" value={String(order.orderedQty)} />
            <KV label="Order Amount" value={fmt(order.orderAmount)} />
            <KV label="Received Qty" value={String(order.receivedQty)} />
            <KV label="Pending Qty" value={String(order.pendingQty)} highlight />
          </div>
        </div>

        {/* Material Receiving Table */}
        <div className="cento-card !p-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="cento-section-header">Material Receiving</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Material Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ordered</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pending</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Accepted</th>
                  <th className="px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice Price</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Taxes</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tax Amt</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((row) => (
                  <tr key={row.id} className={cn("border-b border-border/40 align-top", row.hasError && "bg-destructive/5")}>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.code}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{row.unit}</td>
                    <td className="px-4 py-3 text-muted-foreground text-right tabular-nums">{row.orderedQty}</td>
                    <td className="px-4 py-3 text-amber-700 text-right tabular-nums font-medium">{row.pendingQty}</td>
                    <td className="px-4 py-3">
                      <Input type="number" min={0} max={row.pendingQty} value={row.acceptedQty || ""} onChange={(e) => updateMaterial(row.id, { acceptedQty: parseFloat(e.target.value) || 0 })}
                        className={cn("h-8 text-sm text-right bg-card w-24", row.hasError && "border-destructive")} />
                      {row.hasError && (
                        <p className="text-[10px] text-destructive mt-1">Cannot exceed pending ({row.pendingQty})</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Input type="text" value={row.batchName} onChange={(e) => updateMaterial(row.id, { batchName: e.target.value })} placeholder="Optional" className="h-8 text-xs bg-card w-28" />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min={0} step={0.01} value={row.invoiceUnitPrice || ""} onChange={(e) => updateMaterial(row.id, { invoiceUnitPrice: parseFloat(e.target.value) || 0 })} className="h-8 text-sm text-right bg-card w-28" />
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="flex flex-col gap-1.5">
                        {row.taxes.map((t) => (
                          <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-medium text-foreground w-fit">
                            {t.taxName} {t.taxRate}%
                          </span>
                        ))}
                        <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-fit py-0.5 px-2 rounded border border-primary/20 hover:bg-primary/5"
                          onClick={() => { setTaxModal({ rowId: row.id, type: "material" }); setTaxModalTypeId(""); }}>
                          <Plus className="h-3 w-3" /> Add Tax
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">₹{row.totalTaxAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{row.totalLineAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Short Supply */}
        {shortItems.length > 0 && (
          <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold text-foreground">Short Supply Details</h3>
            </div>
            <div className="space-y-4">
              {shortItems.map((item) => {
                const shortQty = item.pendingQty - item.acceptedQty;
                return (
                  <div key={item.id} className="bg-background/80 rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">Short: <span className="font-semibold text-amber-700">{shortQty}</span> (of {item.pendingQty} pending)</span>
                    </div>
                    {/* Read-only fields */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Material Name</label>
                        <p className="text-sm font-medium">{item.name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 block">{isOutletOrTransfer ? "Dispatch Pending Qty" : "Pending Qty"}</label>
                        <p className="text-sm font-medium text-amber-700">{item.pendingQty}</p>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 block">Accepted Qty</label>
                        <p className="text-sm font-medium text-emerald-700">{item.acceptedQty}</p>
                      </div>
                    </div>
                    <div className={cn("grid gap-3", isOutletOrTransfer ? "grid-cols-3" : "grid-cols-2")}>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Short Reason <span className="text-destructive">*</span></label>
                        <Select value={item.shortReason} onValueChange={(v) => updateMaterial(item.id, { shortReason: v })}>
                          <SelectTrigger className="bg-card text-sm"><SelectValue placeholder="Select reason" /></SelectTrigger>
                          <SelectContent>{SHORT_SUPPLY_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      {isOutletOrTransfer && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1.5 block">Mark Pending Units as Wastage <span className="text-destructive">*</span></label>
                          <Input
                            type="number"
                            min={0}
                            max={shortQty}
                            value={item.wastageQty}
                            onChange={(e) => {
                              const val = e.target.value === "" ? -1 : parseFloat(e.target.value);
                              const wastageError = val < 0 || val > shortQty;
                              updateMaterial(item.id, { wastageQty: val < 0 ? 0 : val, wastageError: val < 0 || val > shortQty });
                            }}
                            className={cn("bg-card text-sm", item.wastageError && "border-destructive")}
                          />
                          {item.wastageQty > shortQty && (
                            <p className="text-[10px] text-destructive mt-1">Cannot exceed short qty ({shortQty})</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">Set to 0 if a follow-up delivery is expected.</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Remarks</label>
                        <Input value={item.shortRemarks} onChange={(e) => updateMaterial(item.id, { shortRemarks: e.target.value })} placeholder="Optional" className="bg-card text-sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Charges */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Other Charges</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={chargeSearch} onChange={(e) => setChargeSearch(e.target.value)}
              onFocus={() => setChargeSearchFocused(true)} onBlur={() => setTimeout(() => setChargeSearchFocused(false), 200)}
              placeholder="Search and add charge reason..." className="pl-9 bg-card h-9 text-sm" />
            {chargeSearchFocused && filteredReasons.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-auto">
                {filteredReasons.map((reason) => (
                  <button key={reason} onMouseDown={() => addOtherCharge(reason)} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left border-b border-border/30 last:border-0">
                    <Plus className="h-3 w-3 text-muted-foreground" />{reason}
                  </button>
                ))}
              </div>
            )}
          </div>
          {otherCharges.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No additional charges added.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Applied Charge</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-36">Value (₹)</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Taxes</th>
                    <th className="px-4 py-2.5 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {otherCharges.map((charge) => (
                    <tr key={charge.id} className="border-b border-border/40 align-top">
                      <td className="px-4 py-3 font-medium text-foreground">{charge.reason}</td>
                      <td className="px-4 py-3">
                        <Input type="number" min={0} value={charge.value || ""} onChange={(e) => setOtherCharges((prev) => prev.map((c) => c.id === charge.id ? { ...c, value: parseFloat(e.target.value) || 0 } : c))} className="h-8 text-sm text-right bg-card w-full" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {charge.taxes.map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-medium text-foreground w-fit">
                              {t.taxName} {t.taxRate}%
                              <button onClick={() => setOtherCharges((prev) => prev.map((c) => c.id === charge.id ? { ...c, taxes: c.taxes.filter((tx) => tx.id !== t.id) } : c))} className="ml-0.5 text-muted-foreground hover:text-foreground"><X className="h-2.5 w-2.5" /></button>
                            </span>
                          ))}
                          <button className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-fit py-0.5 px-2 rounded border border-primary/20 hover:bg-primary/5"
                            onClick={() => { setTaxModal({ rowId: charge.id, type: "charge" }); setTaxModalTypeId(""); }}>
                            <Plus className="h-3 w-3" /> Add Tax
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setOtherCharges((prev) => prev.filter((c) => c.id !== charge.id))} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Receiving Summary */}
        {materials.length > 0 && <POSummaryBlock {...totals} />}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-3 -mx-1 px-1 flex items-center justify-end gap-2">
        <Button variant="ghost" onClick={() => navigate("/procurements/receivings")} className="text-sm">Cancel</Button>
        <Button variant="cento" disabled={!canSubmit} onClick={() => setShowSubmitDialog(true)} className="text-sm">Submit Receiving</Button>
      </div>

      {/* Tax Modal */}
      <Dialog open={!!taxModal} onOpenChange={(open) => { if (!open) { setTaxModal(null); setTaxModalTypeId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Tax</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Name</Label>
              <Select value={taxModalTypeId} onValueChange={setTaxModalTypeId}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select tax type" /></SelectTrigger>
                <SelectContent>{MOCK_TAX_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {taxModalTypeId && MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId) && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Value (%)</Label>
                <Input value={`${MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId)!.rate}%`} disabled className="bg-muted" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTaxModal(null); setTaxModalTypeId(""); }}>Cancel</Button>
            <Button variant="cento" disabled={!taxModalTypeId} onClick={addTaxToRow}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit confirmation */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Receiving?</DialogTitle>
            <DialogDescription>Submitting this receiving will update stock levels. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button variant="cento" onClick={() => { setShowSubmitDialog(false); navigate("/procurements/receivings"); }}>Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={cn("text-xs font-medium", highlight ? "text-amber-700" : "text-foreground")}>{value}</p>
    </div>
  );
}
