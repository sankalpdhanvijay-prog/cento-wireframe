import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  CalendarIcon,
  MapPin,
  Link as LinkIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  POSummaryBlock,
  ShortSupplySection,
  MismatchModal,
  recalcRow,
  createEmptyRow,
  type ReceivingMaterialRow,
} from "./ReceivingFormShared";

const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
];

interface MockPO {
  id: string;
  poNumber: string;
  vendor: string;
  poDate: string;
  status: "Open" | "Partially Received" | "Fully Received";
  totalOrdered: number;
  totalReceived: number;
  pendingQty: number;
  materials: {
    id: string;
    name: string;
    unit: string;
    ordered: number;
    received: number;
    pending: number;
    unitPrice: number;
  }[];
}

const MOCK_POS: MockPO[] = [
  {
    id: "po1", poNumber: "PO-2026-045", vendor: "Fresh Farms Pvt Ltd", poDate: "2026-02-01",
    status: "Open", totalOrdered: 200, totalReceived: 0, pendingQty: 200,
    materials: [
      { id: "m1", name: "Basmati Rice", unit: "KG", ordered: 100, received: 0, pending: 100, unitPrice: 85 },
      { id: "m2", name: "Olive Oil (Extra Virgin)", unit: "LTR", ordered: 50, received: 0, pending: 50, unitPrice: 420 },
      { id: "m4", name: "Onion (Red)", unit: "KG", ordered: 50, received: 0, pending: 50, unitPrice: 32 },
    ],
  },
  {
    id: "po2", poNumber: "PO-2026-038", vendor: "Daily Dairy Supplies", poDate: "2026-01-28",
    status: "Partially Received", totalOrdered: 150, totalReceived: 70, pendingQty: 80,
    materials: [
      { id: "m7", name: "Mozzarella Cheese", unit: "KG", ordered: 50, received: 20, pending: 30, unitPrice: 560 },
      { id: "m3", name: "Chicken Breast", unit: "KG", ordered: 100, received: 50, pending: 50, unitPrice: 240 },
    ],
  },
  {
    id: "po3", poNumber: "PO-2026-050", vendor: "Fresh Farms Pvt Ltd", poDate: "2026-02-05",
    status: "Fully Received", totalOrdered: 120, totalReceived: 120, pendingQty: 0,
    materials: [],
  },
];

export default function POBasedReceiving() {
  const navigate = useNavigate();
  const isAdmin = true;

  const [outlet, setOutlet] = useState("o1");
  const [receivingDate, setReceivingDate] = useState<Date>(new Date());
  const [selectedPO, setSelectedPO] = useState<MockPO | null>(null);
  const [poSearch, setPOSearch] = useState("");
  const [poSearchFocused, setPOSearchFocused] = useState(false);
  const [materials, setMaterials] = useState<ReceivingMaterialRow[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showOutletWarning, setShowOutletWarning] = useState(false);
  const [pendingOutlet, setPendingOutlet] = useState<string | null>(null);

  // Mismatch modal state
  const [showMismatch, setShowMismatch] = useState(false);
  const [mismatchReason, setMismatchReason] = useState("");
  const [mismatchRemarks, setMismatchRemarks] = useState("");

  const receivingId = useMemo(() => "RCV-2026-" + String(Math.floor(Math.random() * 900) + 100), []);

  const filteredPOs = useMemo(() => {
    if (!poSearch.trim()) return [];
    const q = poSearch.toLowerCase();
    return MOCK_POS.filter(
      (po) =>
        po.status !== "Fully Received" &&
        (po.poNumber.toLowerCase().includes(q) || po.vendor.toLowerCase().includes(q))
    );
  }, [poSearch]);

  const selectPO = useCallback((po: MockPO) => {
    setSelectedPO(po);
    setPOSearch("");
    setMaterials(
      po.materials.map((m) =>
        recalcRow(
          createEmptyRow({
            id: crypto.randomUUID(),
            materialId: m.id,
            name: m.name,
            unit: m.unit,
            orderedQty: m.ordered,
            acceptedQty: m.ordered,
            poUnitPrice: m.unitPrice,
            invoiceUnitPrice: m.unitPrice,
            taxPercent: 5,
          }),
          true
        )
      )
    );
  }, []);

  const updateMaterial = useCallback((id: string, updates: Partial<ReceivingMaterialRow>) => {
    setMaterials((prev) =>
      prev.map((r) => (r.id === id ? recalcRow({ ...r, ...updates }, true) : r))
    );
  }, []);

  const totals = useMemo(() => {
    const totalAccepted = materials.reduce((s, r) => s + r.acceptedQty, 0);
    const poTotal = materials.reduce((s, r) => s + r.orderedQty * r.poUnitPrice, 0);
    const invoiceSubtotal = materials.reduce((s, r) => s + r.lineTotal, 0);
    const totalTax = materials.reduce((s, r) => s + r.taxAmount, 0);
    const grandTotal = invoiceSubtotal + totalTax;
    return { totalAccepted, poTotal, invoiceSubtotal, totalTax, grandTotal };
  }, [materials]);

  const shortItems = materials.filter((m) => m.acceptedQty < m.orderedQty && m.orderedQty > 0);

  const hasErrors = materials.some((r) => r.hasError);
  const hasAccepted = materials.some((r) => r.acceptedQty > 0);

  // Short supply validation
  const shortSupplyValid = shortItems.every(
    (r) => r.shortReason && (r.shortReason !== "Other" || r.shortRemarks.trim().length > 0)
  );

  const canSubmit = hasAccepted && !hasErrors && materials.length > 0 && shortSupplyValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Check mismatch
    if (Math.abs(totals.poTotal - totals.grandTotal) > 0.01) {
      setMismatchReason("");
      setMismatchRemarks("");
      setShowMismatch(true);
    } else {
      setShowSubmitDialog(true);
    }
  };

  const handleMismatchConfirm = () => {
    setShowMismatch(false);
    setShowSubmitDialog(true);
  };

  const handleOutletChange = (val: string) => {
    if (selectedPO) {
      setPendingOutlet(val);
      setShowOutletWarning(true);
    } else {
      setOutlet(val);
    }
  };

  const confirmOutletChange = () => {
    if (pendingOutlet) {
      setOutlet(pendingOutlet);
      setSelectedPO(null);
      setMaterials([]);
      setPendingOutlet(null);
    }
    setShowOutletWarning(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4 -mx-1 px-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/procurements/new-receiving")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Select value={outlet} onValueChange={handleOutletChange} disabled={!isAdmin}>
              <SelectTrigger className="w-[170px] h-9 text-xs bg-card">
                <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_OUTLETS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground font-mono">{receivingId}</span>
            <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">Draft</Badge>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs bg-card font-normal">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {format(receivingDate, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={receivingDate} onSelect={(d) => d && setReceivingDate(d)} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <Badge variant="outline" className="text-[10px] border-border bg-muted/50 text-muted-foreground">PO Based</Badge>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto pb-32 max-w-6xl">
        {/* PO Selection */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Purchase Order</h3>
          {!selectedPO ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={poSearch}
                onChange={(e) => setPOSearch(e.target.value)}
                onFocus={() => setPOSearchFocused(true)}
                onBlur={() => setTimeout(() => setPOSearchFocused(false), 200)}
                placeholder="Search by PO number..."
                className="pl-9 bg-card"
              />
              {poSearchFocused && filteredPOs.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[240px] overflow-auto">
                  {filteredPOs.map((po) => (
                    <button
                      key={po.id}
                      onMouseDown={() => selectPO(po)}
                      disabled={po.status === "Fully Received"}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left border-b border-border/30 last:border-0",
                        po.status === "Fully Received" ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/60"
                      )}
                    >
                      <div>
                        <span className="font-medium">{po.poNumber}</span>
                        <span className="text-muted-foreground ml-2">· {po.vendor}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          po.status === "Open" && "border-emerald-200 text-emerald-700",
                          po.status === "Partially Received" && "border-amber-200 text-amber-700",
                          po.status === "Fully Received" && "border-border text-muted-foreground"
                        )}
                      >
                        {po.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
              {poSearch && filteredPOs.length === 0 && poSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 p-4 text-center">
                  <p className="text-sm text-muted-foreground">No matching purchase orders</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-cento-yellow" />
                    <span className="text-sm font-semibold text-foreground">{selectedPO.poNumber}</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">{selectedPO.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-muted-foreground">
                    <span>Vendor: <span className="text-foreground font-medium">{selectedPO.vendor}</span></span>
                    <span>PO Date: <span className="text-foreground">{format(new Date(selectedPO.poDate), "dd MMM yyyy")}</span></span>
                    <span>Total Ordered: <span className="text-foreground font-medium">{selectedPO.totalOrdered}</span></span>
                    <span>Pending: <span className="text-foreground font-semibold">{selectedPO.pendingQty}</span></span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedPO(null); setMaterials([]); }} className="text-xs text-muted-foreground">
                  Change
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Materials Table */}
        {selectedPO && (
          <div className="cento-card !p-0">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="cento-section-header">Materials Receiving</h3>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[1.4fr_70px_80px_90px_100px_60px_90px_80px_100px] gap-2 px-4 py-2.5 bg-muted/30 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Item Name</span>
                  <span className="text-right">Ordered</span>
                  <span>Accepted</span>
                  <span className="text-right">PO Price</span>
                  <span>Invoice Price</span>
                  <span>Tax %</span>
                  <span className="text-right">Line Total</span>
                  <span className="text-right">Tax Amt</span>
                  <span className="text-right">Total</span>
                </div>
                {materials.map((row) => {
                  const priceMismatch = row.invoiceUnitPrice !== row.poUnitPrice;
                  return (
                    <div key={row.id} className={cn("border-b border-border/40", row.hasError && "bg-destructive/5")}>
                      <div className="grid grid-cols-[1.4fr_70px_80px_90px_100px_60px_90px_80px_100px] gap-2 px-4 py-3 items-center">
                        <span className="text-sm font-medium text-foreground">{row.name}
                          <span className="text-xs text-muted-foreground ml-1.5">{row.unit}</span>
                        </span>
                        <span className="text-sm text-muted-foreground text-right">{row.orderedQty}</span>
                        <Input
                          type="number"
                          min={0}
                          value={row.acceptedQty || ""}
                          onChange={(e) => updateMaterial(row.id, { acceptedQty: parseFloat(e.target.value) || 0 })}
                          className={cn("h-8 text-sm text-right bg-card", row.hasError && "border-destructive")}
                        />
                        <span className="text-sm text-muted-foreground text-right">₹{row.poUnitPrice.toFixed(2)}</span>
                        <div className="relative">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.invoiceUnitPrice || ""}
                            onChange={(e) => updateMaterial(row.id, { invoiceUnitPrice: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-sm text-right bg-card"
                          />
                          {priceMismatch && (
                            <Badge variant="outline" className="absolute -top-2.5 -right-1 text-[8px] px-1 py-0 border-amber-300 bg-amber-50 text-amber-700 leading-tight">
                              Mismatch
                            </Badge>
                          )}
                        </div>
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          value={row.taxPercent || ""}
                          onChange={(e) => updateMaterial(row.id, { taxPercent: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-sm text-right bg-card"
                        />
                        <span className="text-sm text-foreground text-right">₹{row.lineTotal.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground text-right">₹{row.taxAmount.toFixed(2)}</span>
                        <span className="text-sm font-semibold text-foreground text-right">₹{row.totalLineAmount.toFixed(2)}</span>
                      </div>
                      {row.hasError && (
                        <div className="px-4 pb-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                          <span className="text-xs text-destructive">{row.errorMessage}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Short Supply Details */}
        {selectedPO && <ShortSupplySection materials={materials} onUpdate={updateMaterial} />}

        {/* Summary */}
        {selectedPO && materials.length > 0 && <POSummaryBlock {...totals} />}
      </div>

      {/* Sticky Footer */}
      {selectedPO && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-3 -mx-1 px-1 flex items-center justify-between">
          <Button variant="outline" className="text-sm">Save Draft</Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/procurements/new-receiving")} className="text-sm">Cancel</Button>
            <Button variant="cento" disabled={!canSubmit} onClick={handleSubmit} className="text-sm">Submit Receiving</Button>
          </div>
        </div>
      )}

      {/* Mismatch Modal */}
      <MismatchModal
        open={showMismatch}
        onOpenChange={setShowMismatch}
        poTotal={totals.poTotal}
        invoiceTotal={totals.grandTotal}
        reason={mismatchReason}
        remarks={mismatchRemarks}
        onReasonChange={setMismatchReason}
        onRemarksChange={setMismatchRemarks}
        onConfirm={handleMismatchConfirm}
      />

      {/* Outlet change warning */}
      <Dialog open={showOutletWarning} onOpenChange={setShowOutletWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Outlet?</DialogTitle>
            <DialogDescription>Changing the outlet will reset the selected purchase order and all entered data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOutletWarning(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmOutletChange}>Change Outlet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit confirmation */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Receiving?</DialogTitle>
            <DialogDescription>Submitting this receiving will update stock levels immediately. This action cannot be edited afterward.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button variant="cento" onClick={() => { setShowSubmitDialog(false); navigate("/procurements/new-receiving"); }}>Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
