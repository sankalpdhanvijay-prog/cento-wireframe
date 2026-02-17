import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  CalendarIcon,
  MapPin,
  Plus,
  AlertTriangle } from
"lucide-react";
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
  SelectValue } from
"@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger } from
"@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter } from
"@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DirectSummaryBlock,
  recalcRow,
  createEmptyRow,
  type ReceivingMaterialRow } from
"./ReceivingFormShared";

const MOCK_OUTLETS = [
{ id: "o1", name: "Main Kitchen" },
{ id: "o2", name: "Branch - Indiranagar" },
{ id: "o3", name: "Branch - Koramangala" }];


const MOCK_VENDORS = [
{ id: "v1", name: "Fresh Farms Pvt Ltd" },
{ id: "v2", name: "Spice World Traders" },
{ id: "v3", name: "Daily Dairy Supplies" },
{ id: "v4", name: "Ocean Catch Seafoods" }];


const MOCK_MATERIALS = [
{ id: "m1", name: "Basmati Rice", unit: "KG", lastPrice: 85 },
{ id: "m2", name: "Olive Oil (Extra Virgin)", unit: "LTR", lastPrice: 620 },
{ id: "m3", name: "Chicken Breast", unit: "KG", lastPrice: 280 },
{ id: "m4", name: "Onion (Red)", unit: "KG", lastPrice: 35 },
{ id: "m5", name: "Tomato Paste", unit: "KG", lastPrice: 150 },
{ id: "m6", name: "Cumin Powder", unit: "KG", lastPrice: 450 },
{ id: "m7", name: "Mozzarella Cheese", unit: "KG", lastPrice: 520 },
{ id: "m8", name: "All-Purpose Flour", unit: "KG", lastPrice: 42 }];


export default function DirectReceiving() {
  const navigate = useNavigate();
  const isAdmin = true;

  const [outlet, setOutlet] = useState("o1");
  const [receivingDate, setReceivingDate] = useState<Date>(new Date());
  const [vendor, setVendor] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date());
  const [reference, setReference] = useState("");
  const [materials, setMaterials] = useState<ReceivingMaterialRow[]>([]);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialSearchFocused, setMaterialSearchFocused] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const receivingId = useMemo(() => "RCV-2026-" + String(Math.floor(Math.random() * 900) + 100), []);

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
    recalcRow(createEmptyRow({ id: crypto.randomUUID(), materialId: m.id, name: m.name, unit: m.unit, invoiceUnitPrice: m.lastPrice }), false)]
    );
    setMaterialSearch("");
  }, [materials]);

  const removeMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateMaterial = useCallback((id: string, updates: Partial<ReceivingMaterialRow>) => {
    setMaterials((prev) =>
    prev.map((r) => r.id === id ? recalcRow({ ...r, ...updates }, false) : r)
    );
  }, []);

  const totals = useMemo(() => {
    const invoiceSubtotal = materials.reduce((s, r) => s + r.lineTotal, 0);
    const totalTax = materials.reduce((s, r) => s + r.taxAmount, 0);
    const grandTotal = invoiceSubtotal + totalTax;
    return { invoiceSubtotal, totalTax, grandTotal };
  }, [materials]);

  const hasAccepted = materials.some((r) => r.acceptedQty > 0);
  const canSubmit = hasAccepted && !!vendor && !!invoiceDate && materials.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4 -mx-1 px-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/procurements/new-receiving")}
              className="text-muted-foreground hover:text-foreground transition-colors">

              <ArrowLeft className="h-4 w-4" />
            </button>
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
            <span className="text-xs text-muted-foreground font-mono">{receivingId}</span>
            <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">Draft</Badge>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PO Creation Date:</span>
              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">{format(receivingDate, "dd MMM yyyy")}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-border bg-muted/50 text-muted-foreground">Direct Receiving</Badge>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto pb-32 max-w-5xl">
        {/* Vendor Block */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Vendor Details</h3>
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
              <Label className="text-xs text-muted-foreground mb-1.5 block">Reference Invoice File</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Optional" className="bg-card" />
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
                className="pl-8 h-8 text-xs bg-card" />

              {materialSearchFocused && filteredMaterials.length > 0 &&
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-auto">
                  {filteredMaterials.map((m) =>
                <button
                  key={m.id}
                  onMouseDown={() => addMaterial(m)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left">

                      <Plus className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{m.unit}</span>
                    </button>
                )}
                </div>
              }
            </div>
          </div>

          {materials.length === 0 ?
          <div className="cento-empty-state py-12">
              <p className="text-sm text-muted-foreground">No materials added yet. Use the search above to add items.</p>
            </div> :

          <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[1.5fr_80px_100px_60px_90px_80px_90px_36px] gap-2 px-4 py-2.5 bg-muted/30 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Item Name</span>
                  <span>Accepted</span>
                  <span>Invoice Price</span>
                  <span>Tax %</span>
                  <span className="text-right">Line Total</span>
                  <span className="text-right">Tax Amt</span>
                  <span className="text-right">Total</span>
                  <span></span>
                </div>
                {materials.map((row) =>
              <div key={row.id} className="grid grid-cols-[1.5fr_80px_100px_60px_90px_80px_90px_36px] gap-2 px-4 py-3 items-center border-b border-border/40">
                    <span className="text-sm font-medium text-foreground">{row.name}
                      <span className="text-xs text-muted-foreground ml-1.5">{row.unit}</span>
                    </span>
                    <Input
                  type="number"
                  min={0}
                  value={row.acceptedQty || ""}
                  onChange={(e) => updateMaterial(row.id, { acceptedQty: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm text-right bg-card" />

                    <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={row.invoiceUnitPrice || ""}
                  onChange={(e) => updateMaterial(row.id, { invoiceUnitPrice: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm text-right bg-card" />

                    <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={row.taxPercent || ""}
                  onChange={(e) => updateMaterial(row.id, { taxPercent: parseFloat(e.target.value) || 0 })}
                  className="h-8 text-sm text-right bg-card" />

                    <span className="text-sm text-foreground text-right">₹{row.lineTotal.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground text-right">₹{row.taxAmount.toFixed(2)}</span>
                    <span className="text-sm font-semibold text-foreground text-right">₹{row.totalLineAmount.toFixed(2)}</span>
                    <button onClick={() => removeMaterial(row.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
              )}
              </div>
            </div>
          }
        </div>

        {/* Summary */}
        {materials.length > 0 && <DirectSummaryBlock {...totals} />}
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border py-3 -mx-1 px-1 flex items-center justify-between">
        <Button variant="outline" className="text-sm">Save Draft</Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/procurements/new-receiving")} className="text-sm">Cancel</Button>
          <Button variant="cento" disabled={!canSubmit} onClick={() => setShowSubmitDialog(true)} className="text-sm">Submit Receiving</Button>
        </div>
      </div>

      {/* Submit confirmation */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Receiving?</DialogTitle>
            <DialogDescription>Submitting this receiving will update stock levels immediately. This action cannot be edited afterward.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
            <Button variant="cento" onClick={() => {setShowSubmitDialog(false);navigate("/procurements/new-receiving");}}>Confirm & Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>);

}