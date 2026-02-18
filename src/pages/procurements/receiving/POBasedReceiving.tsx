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
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "./ReceivingFormShared";

// --- Mock Data ---
const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
];

const MOCK_TAX_TYPES = [
  { id: "t1", name: "GST", rate: 18 },
  { id: "t2", name: "IGST", rate: 18 },
  { id: "t3", name: "SGST", rate: 9 },
  { id: "t4", name: "CGST", rate: 9 },
];

const MOCK_OTHER_CHARGE_REASONS = [
  "Freight Charges",
  "Packaging Charges",
  "Inspection Fee",
  "Loading / Unloading",
  "Insurance",
  "Handling Charges",
  "Other",
];

const EXCESS_SUPPLY_REASONS = [
  "Vendor Over-shipped",
  "PO Quantity Updated",
  "Accepted as Buffer Stock",
  "Measurement Variance",
  "Other",
];

const SHORT_SUPPLY_REASONS = [
  "Short Supply",
  "Damaged",
  "Expired",
  "Quality Issue",
  "Other",
];

interface MockPO {
  id: string;
  poNumber: string;
  vendor: string;
  poDate: string;
  edd: string;
  poPrice: number;
  status: "Open" | "Partially Received" | "Fully Received";
  totalOrdered: number;
  totalReceived: number;
  pendingQty: number;
  materials: {
    id: string;
    code: string;
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
    edd: "2026-02-15", poPrice: 28700, status: "Open", totalOrdered: 200, totalReceived: 0, pendingQty: 200,
    materials: [
      { id: "m1", code: "RM-001", name: "Basmati Rice", unit: "KG", ordered: 100, received: 0, pending: 100, unitPrice: 85 },
      { id: "m2", code: "RM-002", name: "Olive Oil (Extra Virgin)", unit: "LTR", ordered: 50, received: 0, pending: 50, unitPrice: 420 },
      { id: "m4", code: "RM-004", name: "Onion (Red)", unit: "KG", ordered: 50, received: 0, pending: 50, unitPrice: 32 },
    ],
  },
  {
    id: "po2", poNumber: "PO-2026-038", vendor: "Daily Dairy Supplies", poDate: "2026-01-28",
    edd: "2026-02-10", poPrice: 39200, status: "Partially Received", totalOrdered: 150, totalReceived: 70, pendingQty: 80,
    materials: [
      { id: "m7", code: "RM-007", name: "Mozzarella Cheese", unit: "KG", ordered: 50, received: 20, pending: 30, unitPrice: 560 },
      { id: "m3", code: "RM-003", name: "Chicken Breast", unit: "KG", ordered: 100, received: 50, pending: 50, unitPrice: 240 },
    ],
  },
];

// --- Types ---
interface TaxEntry {
  id: string;
  taxTypeId: string;
  taxName: string;
  taxRate: number;
}

interface MaterialRow {
  id: string;
  materialId: string;
  code: string;
  name: string;
  unit: string;
  orderedQty: number;
  acceptedQty: number;
  batchName: string;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  taxes: TaxEntry[];
  totalTaxAmount: number;
  lineTotal: number;
  totalLineAmount: number;
  hasError: boolean;
  errorMessage: string;
  // short supply
  shortReason: string;
  shortRemarks: string;
  // excess supply
  excessReason: string;
  excessRemarks: string;
}

interface OtherCharge {
  id: string;
  reason: string;
  value: number;
  taxes: TaxEntry[];
}

function recalcMaterialRow(row: MaterialRow): MaterialRow {
  const lineTotal = row.acceptedQty * row.invoiceUnitPrice;
  const totalTaxPct = row.taxes.reduce((s, t) => s + t.taxRate, 0);
  const totalTaxAmount = lineTotal * (totalTaxPct / 100);
  const totalLineAmount = lineTotal + totalTaxAmount;
  const hasError = row.acceptedQty > row.orderedQty && row.orderedQty > 0;
  const errorMessage = ""; // handled separately
  return { ...row, lineTotal, totalTaxAmount, totalLineAmount, hasError, errorMessage };
}

function createMaterialRow(m: MockPO["materials"][0]): MaterialRow {
  return recalcMaterialRow({
    id: crypto.randomUUID(),
    materialId: m.id,
    code: m.code,
    name: m.name,
    unit: m.unit,
    orderedQty: m.pending,
    acceptedQty: m.pending,
    batchName: "",
    poUnitPrice: m.unitPrice,
    invoiceUnitPrice: m.unitPrice,
    taxes: [],
    totalTaxAmount: 0,
    lineTotal: 0,
    totalLineAmount: 0,
    hasError: false,
    errorMessage: "",
    shortReason: "",
    shortRemarks: "",
    excessReason: "",
    excessRemarks: "",
  });
}

export default function POBasedReceiving() {
  const navigate = useNavigate();
  const isAdmin = true;

  const [outlet, setOutlet] = useState("o1");
  const [receivingDate, setReceivingDate] = useState<Date>(new Date());
  const [selectedPO, setSelectedPO] = useState<MockPO | null>(null);
  const [poSearch, setPOSearch] = useState("");
  const [poSearchFocused, setPOSearchFocused] = useState(false);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);
  const [chargeSearch, setChargeSearch] = useState("");
  const [chargeSearchFocused, setChargeSearchFocused] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showOutletWarning, setShowOutletWarning] = useState(false);
  const [pendingOutlet, setPendingOutlet] = useState<string | null>(null);

  // Tax modal for materials
  const [taxModal, setTaxModal] = useState<{ rowId: string; type: "material" | "charge" } | null>(null);
  const [taxModalTypeId, setTaxModalTypeId] = useState("");

  // Mismatch modal
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

  const filteredReasons = useMemo(() => {
    if (!chargeSearch.trim()) return MOCK_OTHER_CHARGE_REASONS;
    const q = chargeSearch.toLowerCase();
    return MOCK_OTHER_CHARGE_REASONS.filter((r) => r.toLowerCase().includes(q));
  }, [chargeSearch]);

  const selectPO = useCallback((po: MockPO) => {
    setSelectedPO(po);
    setPOSearch("");
    setMaterials(po.materials.map(createMaterialRow));
  }, []);

  const updateMaterial = useCallback((id: string, updates: Partial<MaterialRow>) => {
    setMaterials((prev) =>
      prev.map((r) => (r.id === id ? recalcMaterialRow({ ...r, ...updates }) : r))
    );
  }, []);

  const addTaxToRow = () => {
    if (!taxModal || !taxModalTypeId) return;
    const tax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId);
    if (!tax) return;

    if (taxModal.type === "material") {
      setMaterials((prev) =>
        prev.map((r) => {
          if (r.id !== taxModal.rowId) return r;
          if (r.taxes.some((t) => t.taxTypeId === taxModalTypeId)) return r;
          const newTax: TaxEntry = { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate };
          return recalcMaterialRow({ ...r, taxes: [...r.taxes, newTax] });
        })
      );
    } else {
      setOtherCharges((prev) =>
        prev.map((c) => {
          if (c.id !== taxModal.rowId) return c;
          if (c.taxes.some((t) => t.taxTypeId === taxModalTypeId)) return c;
          const newTax: TaxEntry = { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate };
          return { ...c, taxes: [...c.taxes, newTax] };
        })
      );
    }
    setTaxModal(null);
    setTaxModalTypeId("");
  };

  const removeTaxFromMaterial = (rowId: string, taxId: string) => {
    setMaterials((prev) =>
      prev.map((r) =>
        r.id === rowId ? recalcMaterialRow({ ...r, taxes: r.taxes.filter((t) => t.id !== taxId) }) : r
      )
    );
  };

  const removeTaxFromCharge = (chargeId: string, taxId: string) => {
    setOtherCharges((prev) =>
      prev.map((c) =>
        c.id === chargeId ? { ...c, taxes: c.taxes.filter((t) => t.id !== taxId) } : c
      )
    );
  };

  const addOtherCharge = (reason: string) => {
    setOtherCharges((prev) => [...prev, { id: crypto.randomUUID(), reason, value: 0, taxes: [] }]);
    setChargeSearch("");
    setChargeSearchFocused(false);
  };

  const updateCharge = (id: string, updates: Partial<OtherCharge>) => {
    setOtherCharges((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const removeCharge = (id: string) => {
    setOtherCharges((prev) => prev.filter((c) => c.id !== id));
  };

  const totals = useMemo(() => {
    const totalAccepted = materials.reduce((s, r) => s + r.acceptedQty, 0);
    const poTotal = materials.reduce((s, r) => s + r.orderedQty * r.poUnitPrice, 0);
    const invoiceSubtotal = materials.reduce((s, r) => s + r.lineTotal, 0);
    const totalTax = materials.reduce((s, r) => s + r.totalTaxAmount, 0);
    const grandTotal = invoiceSubtotal + totalTax;
    return { totalAccepted, poTotal, invoiceSubtotal, totalTax, grandTotal };
  }, [materials]);

  const shortItems = materials.filter((m) => m.acceptedQty < m.orderedQty && m.orderedQty > 0);
  const excessItems = materials.filter((m) => m.acceptedQty > m.orderedQty && m.orderedQty > 0);

  const shortSupplyValid = shortItems.every(
    (r) => r.shortReason && (r.shortReason !== "Other" || r.shortRemarks.trim().length > 0)
  );
  const excessSupplyValid = excessItems.every(
    (r) => r.excessReason && (r.excessReason !== "Other" || r.excessRemarks.trim().length > 0)
  );

  const hasAccepted = materials.some((r) => r.acceptedQty > 0);
  const canSubmit = hasAccepted && materials.length > 0 && shortSupplyValid && excessSupplyValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (Math.abs(totals.poTotal - totals.grandTotal) > 0.01) {
      setMismatchReason("");
      setMismatchRemarks("");
      setShowMismatch(true);
    } else {
      setShowSubmitDialog(true);
    }
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

  const taxModalSelectedTax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId);

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
                placeholder="Search by PO number or vendor..."
                className="pl-9 bg-card"
              />
              {poSearchFocused && filteredPOs.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[240px] overflow-auto">
                  {filteredPOs.map((po) => (
                    <button
                      key={po.id}
                      onMouseDown={() => selectPO(po)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm transition-colors text-left border-b border-border/30 last:border-0 hover:bg-muted/60"
                    >
                      <div>
                        <span className="font-medium">{po.poNumber}</span>
                        <span className="text-muted-foreground ml-2">· {po.vendor}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px]",
                        po.status === "Open" && "border-emerald-200 text-emerald-700",
                        po.status === "Partially Received" && "border-amber-200 text-amber-700"
                      )}>
                        {po.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/20 rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span className="text-sm font-bold text-primary">{selectedPO.poNumber}</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700">{selectedPO.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Vendor</p>
                      <p className="text-xs font-medium text-foreground">{selectedPO.vendor}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">PO Creation Date</p>
                      <p className="text-xs text-foreground">{format(new Date(selectedPO.poDate), "dd MMM yyyy")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">PO Price</p>
                      <p className="text-xs font-medium text-foreground">₹{selectedPO.poPrice.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">EDD</p>
                      <p className="text-xs text-foreground">{format(new Date(selectedPO.edd), "dd MMM yyyy")}</p>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedPO(null); setMaterials([]); }} className="text-xs text-muted-foreground flex-shrink-0">
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
              <table className="w-full text-sm min-w-[1100px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Material Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price/Unit</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ordered</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Accepted</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice Price</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Taxes</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tax Amt</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((row) => {
                    const priceMismatch = row.invoiceUnitPrice !== row.poUnitPrice;
                    const isExcess = row.acceptedQty > row.orderedQty && row.orderedQty > 0;
                    return (
                      <tr key={row.id} className={cn("border-b border-border/40 align-top", isExcess && "bg-destructive/5")}>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{row.code}</td>
                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{row.unit}</td>
                        <td className="px-4 py-3 text-muted-foreground text-right tabular-nums">₹{row.poUnitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-right tabular-nums">{row.orderedQty}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            value={row.acceptedQty || ""}
                            onChange={(e) => updateMaterial(row.id, { acceptedQty: parseFloat(e.target.value) || 0 })}
                            className={cn("h-8 text-sm text-right bg-card w-24", isExcess && "border-destructive")}
                          />
                          {isExcess && (
                            <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Excess supply
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="text"
                            value={row.batchName}
                            onChange={(e) => updateMaterial(row.id, { batchName: e.target.value })}
                            placeholder="Optional"
                            className="h-8 text-xs bg-card w-28"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={row.invoiceUnitPrice || ""}
                              onChange={(e) => updateMaterial(row.id, { invoiceUnitPrice: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-sm text-right bg-card w-28"
                            />
                            {priceMismatch && (
                              <Badge variant="outline" className="absolute -top-2.5 -right-1 text-[8px] px-1 py-0 border-amber-300 bg-amber-50 text-amber-700 leading-tight">
                                Mismatch
                              </Badge>
                            )}
                          </div>
                        </td>
                        {/* Taxes */}
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex flex-col gap-1.5">
                            {row.taxes.map((t) => (
                              <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-medium text-foreground w-fit">
                                {t.taxName} {t.taxRate}%
                                <button onClick={() => removeTaxFromMaterial(row.id, t.id)} className="ml-0.5 text-muted-foreground hover:text-foreground">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                            <button
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-fit py-0.5 px-2 rounded border border-primary/20 hover:bg-primary/5"
                              onClick={() => { setTaxModal({ rowId: row.id, type: "material" }); setTaxModalTypeId(""); }}
                            >
                              <Plus className="h-3 w-3" />
                              Add Tax
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">₹{row.totalTaxAmount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{row.totalLineAmount.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Short Supply Details */}
        {selectedPO && shortItems.length > 0 && (
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
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Ordered: <span className="font-medium text-foreground">{item.orderedQty}</span>
                        {" · "}Accepted: <span className="font-medium text-foreground">{item.acceptedQty}</span>
                        {" · "}Short: <span className="font-semibold text-amber-700">{shortQty}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Reason <span className="text-destructive">*</span></label>
                        <Select value={item.shortReason} onValueChange={(v) => updateMaterial(item.id, { shortReason: v })}>
                          <SelectTrigger className="bg-card text-sm"><SelectValue placeholder="Select reason" /></SelectTrigger>
                          <SelectContent>
                            {SHORT_SUPPLY_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Remarks {isOther && <span className="text-destructive">*</span>}</label>
                        <Input
                          value={item.shortRemarks}
                          onChange={(e) => updateMaterial(item.id, { shortRemarks: e.target.value })}
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
        )}

        {/* Excess Supply Details */}
        {selectedPO && excessItems.length > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Excess Supply Details</h3>
            </div>
            <div className="space-y-4">
              {excessItems.map((item) => {
                const excessQty = item.acceptedQty - item.orderedQty;
                const isOther = item.excessReason === "Other";
                return (
                  <div key={item.id} className="bg-background/80 rounded-lg border border-border/60 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Ordered: <span className="font-medium text-foreground">{item.orderedQty}</span>
                        {" · "}Accepted: <span className="font-medium text-foreground">{item.acceptedQty}</span>
                        {" · "}Excess: <span className="font-semibold text-destructive">{excessQty}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Reason <span className="text-destructive">*</span></label>
                        <Select value={item.excessReason} onValueChange={(v) => updateMaterial(item.id, { excessReason: v })}>
                          <SelectTrigger className="bg-card text-sm"><SelectValue placeholder="Select reason" /></SelectTrigger>
                          <SelectContent>
                            {EXCESS_SUPPLY_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Remarks {isOther && <span className="text-destructive">*</span>}</label>
                        <Input
                          value={item.excessRemarks}
                          onChange={(e) => updateMaterial(item.id, { excessRemarks: e.target.value })}
                          placeholder={isOther ? "Required for 'Other'" : "Optional"}
                          className={cn("bg-card text-sm", isOther && !item.excessRemarks.trim() && "border-destructive")}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Charges */}
        {selectedPO && (
          <div className="cento-card">
            <h3 className="cento-section-header mb-3">Other Charges</h3>
            {/* Search dropdown to add charges */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={chargeSearch}
                onChange={(e) => setChargeSearch(e.target.value)}
                onFocus={() => setChargeSearchFocused(true)}
                onBlur={() => setTimeout(() => setChargeSearchFocused(false), 200)}
                placeholder="Search and add charge reason..."
                className="pl-9 bg-card h-9 text-sm"
              />
              {chargeSearchFocused && filteredReasons.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-auto">
                  {filteredReasons.map((reason) => (
                    <button
                      key={reason}
                      onMouseDown={() => addOtherCharge(reason)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left border-b border-border/30 last:border-0"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                      {reason}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {otherCharges.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No additional charges added.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Applied Charge</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-36">Value (₹)</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Add Taxes on Charge</th>
                      <th className="px-4 py-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherCharges.map((charge) => (
                      <tr key={charge.id} className="border-b border-border/40 align-top">
                        <td className="px-4 py-3 font-medium text-foreground">{charge.reason}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={charge.value || ""}
                            onChange={(e) => updateCharge(charge.id, { value: parseFloat(e.target.value) || 0 })}
                            className="h-8 text-sm text-right bg-card w-full"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            {charge.taxes.map((t) => (
                              <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-medium text-foreground w-fit">
                                {t.taxName} {t.taxRate}%
                                <button onClick={() => removeTaxFromCharge(charge.id, t.id)} className="ml-0.5 text-muted-foreground hover:text-foreground">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                            <button
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-fit py-0.5 px-2 rounded border border-primary/20 hover:bg-primary/5"
                              onClick={() => { setTaxModal({ rowId: charge.id, type: "charge" }); setTaxModalTypeId(""); }}
                            >
                              <Plus className="h-3 w-3" />
                              Add Tax
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => removeCharge(charge.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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

      {/* Add Tax Modal */}
      <Dialog open={!!taxModal} onOpenChange={(open) => { if (!open) { setTaxModal(null); setTaxModalTypeId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Tax</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Name</Label>
              <Select value={taxModalTypeId} onValueChange={setTaxModalTypeId}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select tax type" /></SelectTrigger>
                <SelectContent>
                  {MOCK_TAX_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {taxModalSelectedTax && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Value (%)</Label>
                <Input value={`${taxModalSelectedTax.rate}%`} disabled className="bg-muted" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTaxModal(null); setTaxModalTypeId(""); }}>Cancel</Button>
            <Button variant="cento" disabled={!taxModalTypeId} onClick={addTaxToRow}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        onConfirm={() => { setShowMismatch(false); setShowSubmitDialog(true); }}
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
