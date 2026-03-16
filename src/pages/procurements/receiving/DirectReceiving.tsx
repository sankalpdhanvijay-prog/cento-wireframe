import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  CalendarIcon,
  MapPin,
  Plus,
  X,
  Upload,
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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DirectSummaryBlock } from "./ReceivingFormShared";

const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
];

const MOCK_VENDORS = [
  { id: "v1", name: "Fresh Farms Pvt Ltd" },
  { id: "v2", name: "Spice World Traders" },
  { id: "v3", name: "Daily Dairy Supplies" },
  { id: "v4", name: "Ocean Catch Seafoods" },
];

const MOCK_MATERIALS = [
  { id: "m1", name: "Basmati Rice", unit: "KG", lastPrice: 85 },
  { id: "m2", name: "Olive Oil (Extra Virgin)", unit: "LTR", lastPrice: 620 },
  { id: "m3", name: "Chicken Breast", unit: "KG", lastPrice: 280 },
  { id: "m4", name: "Onion (Red)", unit: "KG", lastPrice: 35 },
  { id: "m5", name: "Tomato Paste", unit: "KG", lastPrice: 150 },
  { id: "m6", name: "Cumin Powder", unit: "KG", lastPrice: 450 },
  { id: "m7", name: "Mozzarella Cheese", unit: "KG", lastPrice: 520 },
  { id: "m8", name: "All-Purpose Flour", unit: "KG", lastPrice: 42 },
];

const MOCK_TAX_TYPES = [
  { id: "t1", name: "GST", rate: 18 },
  { id: "t2", name: "IGST", rate: 18 },
  { id: "t3", name: "SGST", rate: 9 },
  { id: "t4", name: "CGST", rate: 9 },
];

// --- Types ---
interface TaxEntry {
  id: string;
  taxTypeId: string;
  taxName: string;
  taxRate: number;
}

interface DirectMaterialRow {
  id: string;
  materialId: string;
  name: string;
  unit: string;
  acceptedQty: number;
  invoiceUnitPrice: number;
  taxes: TaxEntry[];
  totalTaxAmount: number;
  lineTotal: number;
  totalLineAmount: number;
}

function recalcDirectRow(row: DirectMaterialRow): DirectMaterialRow {
  const lineTotal = row.acceptedQty * row.invoiceUnitPrice;
  const totalTaxPct = row.taxes.reduce((s, t) => s + t.taxRate, 0);
  const totalTaxAmount = lineTotal * (totalTaxPct / 100);
  const totalLineAmount = lineTotal + totalTaxAmount;
  return { ...row, lineTotal, totalTaxAmount, totalLineAmount };
}

export default function DirectReceiving() {
  const navigate = useNavigate();
  const isAdmin = true;

  const [outlet, setOutlet] = useState("o1");
  const [vendor, setVendor] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<DirectMaterialRow[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialSearchFocused, setMaterialSearchFocused] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Tax modal
  const [taxModalRowId, setTaxModalRowId] = useState<string | null>(null);
  const [taxModalTypeId, setTaxModalTypeId] = useState("");

  const grnId = useMemo(() => "GRN-2026-" + String(Math.floor(Math.random() * 900) + 100), []);

  const filteredMaterials = useMemo(() => {
    if (!materialSearch.trim()) return [];
    const q = materialSearch.toLowerCase();
    return MOCK_MATERIALS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) &&
        !materials.some((r) => r.materialId === m.id)
    );
  }, [materialSearch, materials]);

  const addMaterial = useCallback((m: typeof MOCK_MATERIALS[0]) => {
    if (materials.some((r) => r.materialId === m.id)) {
      toast({ title: "Already added", description: `${m.name} is already in the list.` });
      return;
    }
    setMaterials((prev) => [
      ...prev,
      recalcDirectRow({
        id: crypto.randomUUID(),
        materialId: m.id,
        name: m.name,
        unit: m.unit,
        acceptedQty: 0,
        invoiceUnitPrice: m.lastPrice,
        taxes: [],
        totalTaxAmount: 0,
        lineTotal: 0,
        totalLineAmount: 0,
      }),
    ]);
    setMaterialSearch("");
  }, [materials]);

  const removeMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateMaterial = useCallback((id: string, updates: Partial<DirectMaterialRow>) => {
    setMaterials((prev) =>
      prev.map((r) => r.id === id ? recalcDirectRow({ ...r, ...updates }) : r)
    );
  }, []);

  const addTaxToRow = () => {
    if (!taxModalRowId || !taxModalTypeId) return;
    const tax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId);
    if (!tax) return;
    setMaterials((prev) =>
      prev.map((r) => {
        if (r.id !== taxModalRowId) return r;
        if (r.taxes.some((t) => t.taxTypeId === taxModalTypeId)) return r;
        const newTax: TaxEntry = { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate };
        return recalcDirectRow({ ...r, taxes: [...r.taxes, newTax] });
      })
    );
    setTaxModalRowId(null);
    setTaxModalTypeId("");
  };

  const removeTaxFromRow = (rowId: string, taxId: string) => {
    setMaterials((prev) =>
      prev.map((r) =>
        r.id === rowId ? recalcDirectRow({ ...r, taxes: r.taxes.filter((t) => t.id !== taxId) }) : r
      )
    );
  };

  const totals = useMemo(() => {
    const invoiceSubtotal = materials.reduce((s, r) => s + r.lineTotal, 0);
    const totalTax = materials.reduce((s, r) => s + r.totalTaxAmount, 0);
    const grandTotal = invoiceSubtotal + totalTax;
    return { invoiceSubtotal, totalTax, grandTotal };
  }, [materials]);

  const hasAccepted = materials.some((r) => r.acceptedQty > 0);
  const canSubmit = hasAccepted && !!vendor && !!invoiceDate && materials.length > 0;

  const taxModalSelectedTax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTypeId);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4 -mx-1 px-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/procurements/receivings")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">Direct Receiving</h1>
              <p className="text-xs text-muted-foreground">Receive materials directly without a Purchase Order.</p>
            </div>
          </div>
          <Select value={outlet} onValueChange={setOutlet} disabled={!isAdmin}>
            <SelectTrigger className="w-[170px] h-9 text-xs bg-card">
              <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_OUTLETS.map((o) =>
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto pb-32 max-w-5xl">
        {/* Vendor Block */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Receiving Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Vendor <span className="text-destructive">*</span></Label>
              <Select value={vendor} onValueChange={setVendor}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_VENDORS.map((v) =>
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Invoice Number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Optional" className="bg-card" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Invoice Date <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-card", !invoiceDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceDate ? format(invoiceDate, "dd MMM yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={invoiceDate} onSelect={setInvoiceDate} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Invoice File</Label>
              <div className="flex items-center gap-2">
                <label className={cn("flex items-center gap-2 px-3 h-10 w-full rounded-md border border-input bg-card text-sm cursor-pointer hover:bg-muted/40 transition-colors", invoiceFile ? "text-foreground" : "text-muted-foreground")}>
                  <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{invoiceFile ? invoiceFile.name : "Upload invoice file"}</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
                </label>
                {invoiceFile && (
                  <button onClick={() => setInvoiceFile(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Materials Section */}
        <div className="cento-card !p-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="cento-section-header">Materials</h3>
            <div className="relative w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={materialSearch}
                onChange={(e) => setMaterialSearch(e.target.value)}
                onFocus={() => setMaterialSearchFocused(true)}
                onBlur={() => setTimeout(() => setMaterialSearchFocused(false), 200)}
                placeholder="Search & add material..."
                className="pl-8 h-8 text-xs bg-card"
              />
              {materialSearchFocused && filteredMaterials.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-auto">
                  {filteredMaterials.map((m) => (
                    <button
                      key={m.id}
                      onMouseDown={() => addMaterial(m)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{m.unit}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {materials.length === 0 ? (
            <div className="cento-empty-state py-12">
              <p className="text-sm text-muted-foreground">No materials added yet. Use the search above to add items.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Material Name</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Accepted Qty</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice Price</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[160px]">Taxes</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tax Amt</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Stock Price Total</th>
                    <th className="px-4 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((row) => (
                    <tr key={row.id} className="border-b border-border/40 align-top">
                      <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{row.unit}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          value={row.acceptedQty || ""}
                          onChange={(e) => updateMaterial(row.id, { acceptedQty: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-sm text-right bg-card w-24"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={row.invoiceUnitPrice || ""}
                          onChange={(e) => updateMaterial(row.id, { invoiceUnitPrice: parseFloat(e.target.value) || 0 })}
                          className="h-8 text-sm text-right bg-card w-28"
                        />
                      </td>
                      {/* Taxes column */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <div className="flex flex-col gap-1.5">
                          {row.taxes.map((t) => (
                            <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-medium text-foreground w-fit">
                              {t.taxName} {t.taxRate}%
                              <button onClick={() => removeTaxFromRow(row.id, t.id)} className="ml-0.5 text-muted-foreground hover:text-foreground">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                          ))}
                          <button
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-fit py-0.5 px-2 rounded border border-primary/20 hover:bg-primary/5"
                            onClick={() => { setTaxModalRowId(row.id); setTaxModalTypeId(""); }}
                          >
                            <Plus className="h-3 w-3" />
                            Add Tax
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">₹{row.totalTaxAmount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{row.totalLineAmount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => removeMaterial(row.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {materials.length > 0 && <DirectSummaryBlock {...totals} />}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-3 -mx-1 px-1 flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/procurements/receivings")} className="text-sm">Cancel</Button>
          <Button variant="cento" disabled={!canSubmit} onClick={() => setShowSubmitDialog(true)} className="text-sm">Submit Receiving</Button>
        </div>
      </div>

      {/* Add Tax Modal */}
      <Dialog open={!!taxModalRowId} onOpenChange={(open) => { if (!open) { setTaxModalRowId(null); setTaxModalTypeId(""); } }}>
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
            <Button variant="outline" onClick={() => { setTaxModalRowId(null); setTaxModalTypeId(""); }}>Cancel</Button>
            <Button variant="cento" disabled={!taxModalTypeId} onClick={addTaxToRow}>Add</Button>
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
            <Button variant="cento" onClick={() => { setShowSubmitDialog(false); navigate("/procurements/receivings"); }}>Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
