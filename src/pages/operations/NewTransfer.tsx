import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeftRight, Search, Trash2, CalendarIcon, Plus, Lock, Pencil, Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTransferStore } from "@/context/TransferStoreContext";

const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

const MOCK_MATERIALS = [
  { id: "m1", code: "RM-001", name: "Basmati Rice", category: "Grains", primaryUnit: "KG", currentStock: 120, transferPrice: 85 },
  { id: "m2", code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", primaryUnit: "LTR", currentStock: 45, transferPrice: 620 },
  { id: "m3", code: "RM-003", name: "Chicken Breast", category: "Meat", primaryUnit: "KG", currentStock: 30, transferPrice: 280 },
  { id: "m4", code: "RM-004", name: "Onion (Red)", category: "Vegetables", primaryUnit: "KG", currentStock: 200, transferPrice: 35 },
  { id: "m5", code: "RM-005", name: "Tomato Paste", category: "Sauces", primaryUnit: "KG", currentStock: 60, transferPrice: 150 },
  { id: "m6", code: "RM-006", name: "Cumin Powder", category: "Spices", primaryUnit: "KG", currentStock: 15, transferPrice: 450 },
  { id: "m7", code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", primaryUnit: "KG", currentStock: 25, transferPrice: 520 },
  { id: "m8", code: "RM-008", name: "All-Purpose Flour", category: "Grains", primaryUnit: "KG", currentStock: 300, transferPrice: 42 },
  { id: "m9", code: "RM-009", name: "Garlic", category: "Vegetables", primaryUnit: "KG", currentStock: 40, transferPrice: 120 },
  { id: "m10", code: "RM-010", name: "Ginger", category: "Vegetables", primaryUnit: "KG", currentStock: 35, transferPrice: 100 },
];

const MOCK_CATEGORIES = ["Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood"];
const MOCK_UNITS = ["KG", "LTR", "PCS", "GM", "ML", "DOZ", "PKT", "BOX"];

interface TOLineItem {
  id: string;
  materialId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  transferPrice: number;
  transferQty: number;
  transferAmount: number;
}

interface OtherCharge {
  id: string;
  description: string;
  amount: number;
}

// Searchable Dropdown
function SearchableDropdown({ items, selectedId, onSelect, locked, placeholder }: {
  items: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  locked: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((v) => v.id === selectedId);
  const filtered = useMemo(() => !query.trim() ? items : items.filter((v) => v.name.toLowerCase().includes(query.toLowerCase())), [query, items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (locked && selected) {
    return (
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm cursor-not-allowed">
        <span className="text-foreground font-medium truncate">{selected.name}</span>
        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={selected && !open ? selected.name : query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[220px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">No results found</div>
          ) : filtered.map((v) => (
            <button
              key={v.id}
              onMouseDown={() => { onSelect(v.id); setOpen(false); setQuery(""); }}
              className={cn("w-full flex items-start px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0 text-sm font-medium", selectedId === v.id && "bg-muted/40")}
            >{v.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Material Selection Modal
function MaterialSelectionModal({ open, onClose, existingMaterialIds, onAddMaterials }: {
  open: boolean;
  onClose: () => void;
  existingMaterialIds: string[];
  onAddMaterials: (ids: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(existingMaterialIds));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "selected">("all");

  useEffect(() => {
    if (open) { setSelectedIds(new Set(existingMaterialIds)); setSearchQuery(""); setViewMode("all"); }
  }, [open, existingMaterialIds]);

  const categories = useMemo(() => {
    const cats: Record<string, typeof MOCK_MATERIALS> = {};
    MOCK_MATERIALS.forEach((m) => { if (!cats[m.category]) cats[m.category] = []; cats[m.category].push(m); });
    return cats;
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const result: Record<string, typeof MOCK_MATERIALS> = {};
    Object.entries(categories).forEach(([cat, mats]) => {
      const catMatch = cat.toLowerCase().includes(q);
      const filteredMats = mats.filter((m) => {
        if (viewMode === "selected" && !selectedIds.has(m.id)) return false;
        if (!q) return true;
        return catMatch || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
      });
      if (filteredMats.length > 0) result[cat] = filteredMats;
    });
    return result;
  }, [categories, searchQuery, viewMode, selectedIds]);

  const toggleMaterial = (id: string) => setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleCategory = (cat: string) => {
    const mats = categories[cat] || [];
    const allSel = mats.every((m) => selectedIds.has(m.id));
    setSelectedIds((prev) => { const n = new Set(prev); mats.forEach((m) => { if (allSel) n.delete(m.id); else n.add(m.id); }); return n; });
  };
  const toggleAll = () => {
    const allSel = MOCK_MATERIALS.every((m) => selectedIds.has(m.id));
    if (allSel) setSelectedIds(new Set(existingMaterialIds));
    else setSelectedIds(new Set(MOCK_MATERIALS.map((m) => m.id)));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Add Materials</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search categories or materials..." className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
            <button onClick={() => setViewMode("all")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>All</button>
            <button onClick={() => setViewMode("selected")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "selected" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Selected ({selectedIds.size})</button>
          </div>
          <div className="ml-auto">
            <button onClick={toggleAll} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              {MOCK_MATERIALS.every((m) => selectedIds.has(m.id)) ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden border border-border rounded-lg">
          <div className="w-[200px] border-r border-border overflow-y-auto py-2 shrink-0">
            {Object.entries(filteredCategories).map(([cat, mats]) => {
              const allCatSel = (categories[cat] || []).every((m) => selectedIds.has(m.id));
              const someCatSel = (categories[cat] || []).some((m) => selectedIds.has(m.id));
              return (
                <button key={cat} onClick={() => toggleCategory(cat)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left">
                  <Checkbox checked={allCatSel ? true : someCatSel ? "indeterminate" : false} onCheckedChange={() => toggleCategory(cat)} className="h-3.5 w-3.5" />
                  <span className={cn("font-medium text-xs", allCatSel && "text-primary")}>{cat}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">({mats.length})</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {Object.entries(filteredCategories).map(([cat, mats]) => (
              <div key={cat} className="mb-3">
                <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
                {mats.map((m) => (
                  <button key={m.id} onClick={() => toggleMaterial(m.id)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors text-left", selectedIds.has(m.id) && "bg-cento-yellow-tint")}>
                    <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleMaterial(m.id)} className="h-3.5 w-3.5" />
                    <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{m.code}</span>
                    <span className="font-medium text-sm flex-1 truncate">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.primaryUnit}</span>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(filteredCategories).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No materials found</div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="cento" onClick={() => { onAddMaterials(Array.from(selectedIds)); onClose(); }}>Add {selectedIds.size} Material{selectedIds.size !== 1 ? "s" : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN COMPONENT =====================
export default function NewTransfer() {
  const navigate = useNavigate();
  const { addTransfer } = useTransferStore();

  const [buyerOutlet, setBuyerOutlet] = useState("o1");
  const [outletEditOpen, setOutletEditOpen] = useState(false);
  const [outletSearchQuery, setOutletSearchQuery] = useState("");
  const outletEditRef = useRef<HTMLDivElement>(null);

  const [selectedSenderOutlet, setSelectedSenderOutlet] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<TOLineItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [eddError, setEddError] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [materialModalOpen, setMaterialModalOpen] = useState(false);

  const senderLocked = lineItems.length > 0;
  const buyerOutletName = MOCK_OUTLETS.find((o) => o.id === buyerOutlet)?.name ?? "Unknown";
  const senderOutletName = MOCK_OUTLETS.find((o) => o.id === selectedSenderOutlet)?.name;
  const supplierSelected = !!selectedSenderOutlet;

  const senderOutlets = useMemo(() => MOCK_OUTLETS.filter((o) => o.id !== buyerOutlet), [buyerOutlet]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (outletEditRef.current && !outletEditRef.current.contains(e.target as Node)) { setOutletEditOpen(false); setOutletSearchQuery(""); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredOutletsForBuyer = useMemo(() => {
    if (!outletSearchQuery.trim()) return MOCK_OUTLETS;
    const q = outletSearchQuery.toLowerCase();
    return MOCK_OUTLETS.filter((o) => o.name.toLowerCase().includes(q));
  }, [outletSearchQuery]);

  const displayItems = useMemo(() => {
    if (!tableSearchQuery.trim()) return lineItems;
    const q = tableSearchQuery.toLowerCase();
    return lineItems.filter((li) => li.name.toLowerCase().includes(q) || li.code.toLowerCase().includes(q));
  }, [lineItems, tableSearchQuery]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, li) => s + li.transferAmount, 0);
    const totalOtherCharges = otherCharges.reduce((s, c) => s + c.amount, 0);
    return { subtotal, totalOtherCharges, grandTotal: subtotal + totalOtherCharges };
  }, [lineItems, otherCharges]);

  const hasItems = lineItems.length > 0;
  const canGenerate = hasItems && supplierSelected && !!deliveryDate;

  const addMaterialsFromModal = useCallback((materialIds: string[]) => {
    setLineItems((prev) => {
      const existingIds = new Set(prev.map((li) => li.materialId));
      const selectedSet = new Set(materialIds);
      const filtered = prev.filter((li) => selectedSet.has(li.materialId));
      materialIds.forEach((id) => {
        if (existingIds.has(id)) return;
        const mat = MOCK_MATERIALS.find((m) => m.id === id);
        if (!mat) return;
        filtered.push({
          id: crypto.randomUUID(), materialId: mat.id, code: mat.code, name: mat.name, category: mat.category,
          unit: mat.primaryUnit, currentStock: mat.currentStock, transferPrice: mat.transferPrice,
          transferQty: 0, transferAmount: 0,
        });
      });
      return filtered;
    });
  }, []);

  const removeItem = useCallback((id: string) => setLineItems((prev) => prev.filter((li) => li.id !== id)), []);

  const updateItem = useCallback((id: string, updates: Partial<TOLineItem>) => {
    setLineItems((prev) => prev.map((li) => {
      if (li.id !== id) return li;
      const updated = { ...li, ...updates };
      updated.transferAmount = updated.transferPrice * updated.transferQty;
      return updated;
    }));
  }, []);

  const addOtherCharge = () => setOtherCharges((prev) => [...prev, { id: crypto.randomUUID(), description: "", amount: 0 }]);
  const updateOtherCharge = (id: string, updates: Partial<OtherCharge>) => setOtherCharges((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  const removeOtherCharge = (id: string) => setOtherCharges((prev) => prev.filter((c) => c.id !== id));

  const buildPayload = (status: "Drafted" | "Raised") => {
    const now = format(new Date(), "yyyy-MM-dd");
    return {
      buyerOutlet: buyerOutletName, senderOutlet: senderOutletName ?? "", totalValue: totals.grandTotal,
      totalQty: lineItems.reduce((s, li) => s + li.transferQty, 0), createdBy: "Admin", createdOn: now, lastUpdated: now,
      status, expectedDelivery: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : undefined, remarks,
      materials: lineItems.map((li) => ({ name: li.name, orderedQty: li.transferQty, transferPrice: li.transferPrice, lineTotal: li.transferAmount })),
      subtotal: totals.subtotal, otherCharges: totals.totalOtherCharges, grandTotal: totals.grandTotal,
    } as const;
  };

  const handleGenerate = () => {
    if (!deliveryDate) { setEddError(true); return; }
    setEddError(false);
    if (!hasItems || !supplierSelected) return;
    addTransfer(buildPayload("Raised"));
    toast({ title: "Transfer Order Generated", description: "Transfer order has been raised." });
    navigate("/operations/transfers", { state: { tab: "raised" } });
  };

  const handleDraft = () => {
    if (!hasItems || !supplierSelected) return;
    addTransfer(buildPayload("Drafted"));
    toast({ title: "Draft saved", description: "Transfer order saved as draft." });
    navigate("/operations/transfers", { state: { tab: "drafted" } });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="cento-page-title">New Transfer Order</h2>
            <p className="cento-helper mt-0.5">Create a new transfer order</p>
          </div>
        </div>
        <div className="text-right relative" ref={outletEditRef}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer's Outlet</p>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-sm font-semibold text-foreground">{buyerOutletName}</span>
            <button onClick={() => setOutletEditOpen((v) => !v)} className="p-1 rounded hover:bg-muted/60 transition-colors">
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          {outletEditOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <input value={outletSearchQuery} onChange={(e) => setOutletSearchQuery(e.target.value)} placeholder="Search outlets..." className="w-full h-7 pl-7 pr-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" autoFocus />
                </div>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                {filteredOutletsForBuyer.map((o) => (
                  <button key={o.id} onMouseDown={() => { setBuyerOutlet(o.id); setOutletEditOpen(false); setOutletSearchQuery(""); if (selectedSenderOutlet === o.id) setSelectedSenderOutlet(null); }}
                    className={cn("w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors", buyerOutlet === o.id && "bg-cento-yellow-tint font-medium")}>
                    {buyerOutlet === o.id && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                    <span className={buyerOutlet !== o.id ? "ml-5" : ""}>{o.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sender Section */}
      <div className="bg-card border border-border rounded-xl px-6 py-5 mb-6 flex-shrink-0 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sender's Outlet {senderLocked && <span className="ml-1.5 text-xs font-normal normal-case tracking-normal">(locked)</span>}
            </Label>
            <SearchableDropdown items={senderOutlets} selectedId={selectedSenderOutlet} onSelect={(id) => !senderLocked && setSelectedSenderOutlet(id)} locked={senderLocked} placeholder="Search and select sender outlet" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expected Delivery Date <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-10 w-full justify-start text-left font-normal bg-background", !deliveryDate && "text-muted-foreground", eddError && "border-destructive ring-1 ring-destructive")}>
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  {deliveryDate ? format(deliveryDate, "dd MMM yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar mode="single" selected={deliveryDate} onSelect={(d) => { setDeliveryDate(d); if (d) setEddError(false); }} initialFocus className="p-3 pointer-events-auto" disabled={(date) => date < new Date()} />
              </PopoverContent>
            </Popover>
            {eddError && <p className="text-xs text-destructive">Expected Delivery Date is required.</p>}
          </div>
        </div>
      </div>

      {/* Search + Add Material */}
      {supplierSelected && (
        <div className="mb-4 flex-shrink-0 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input value={tableSearchQuery} onChange={(e) => setTableSearchQuery(e.target.value)} placeholder="Search materials in the Transfer Order..." className="pl-9 h-9 text-sm bg-card" />
          </div>
          <Button variant="cento" size="sm" className="h-9 gap-1.5" onClick={() => setMaterialModalOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Material
          </Button>
        </div>
      )}

      {/* Materials Table */}
      {supplierSelected ? (
        <div className="bg-card border border-border rounded-xl shadow-sm mb-6 flex-shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Materials ({lineItems.length})</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Material Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transfer Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transfer Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transfer Amt</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {displayItems.length === 0 && lineItems.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-muted-foreground text-sm py-14">Click "Add Material" to start adding materials</td></tr>
                )}
                {displayItems.length === 0 && lineItems.length > 0 && (
                  <tr><td colSpan={9} className="text-center text-muted-foreground text-sm py-14">No materials match your search</td></tr>
                )}
                {displayItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors align-top">
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{item.code}</td>
                    <td className="px-4 py-4 font-medium whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-4">
                      <Select value={item.category} onValueChange={(val) => updateItem(item.id, { category: val })}>
                        <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{MOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4">
                      <Select value={item.unit} onValueChange={(val) => updateItem(item.id, { unit: val })}>
                        <SelectTrigger className="w-20 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>{MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-right tabular-nums">{item.currentStock}</td>
                    <td className="px-4 py-4 text-right tabular-nums">{item.transferPrice > 0 ? `₹${item.transferPrice.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-4">
                      <Input type="number" min={0} value={item.transferQty || ""} onChange={(e) => updateItem(item.id, { transferQty: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-sm text-right bg-background" />
                    </td>
                    <td className="px-4 py-4 text-right font-semibold tabular-nums">₹{item.transferAmount.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <button onClick={() => removeItem(item.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm flex items-center justify-center py-20 mb-6">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">Select a sender outlet to get started</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a sender outlet above to begin adding materials</p>
          </div>
        </div>
      )}

      {/* Other Charges */}
      {supplierSelected && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Charges</p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addOtherCharge}><Plus className="h-3 w-3" /> Add Charge</Button>
          </div>
          {otherCharges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No additional charges added.</p>
          ) : (
            <div className="space-y-2">
              {otherCharges.map((charge) => (
                <div key={charge.id} className="flex items-center gap-3">
                  <Input placeholder="Description (e.g. Transport)" value={charge.description} onChange={(e) => updateOtherCharge(charge.id, { description: e.target.value })} className="flex-1 h-8 text-sm bg-background" />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input type="number" min={0} value={charge.amount || ""} onChange={(e) => updateOtherCharge(charge.id, { amount: parseFloat(e.target.value) || 0 })} className="h-8 text-sm text-right bg-background pl-6" />
                  </div>
                  <button onClick={() => removeOtherCharge(charge.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remarks + Summary + CTAs */}
      {supplierSelected && (
        <div className="flex gap-6 mb-8 flex-shrink-0 items-start">
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-[3]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Transfer Order Remarks</p>
            <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add any notes or instructions..." className="min-h-[120px] resize-none bg-background text-sm border-border" />
          </div>
          <div className="flex-[2] flex flex-col gap-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Transfer Order Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {totals.totalOtherCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Other Charges</span>
                    <span className="tabular-nums">₹{totals.totalOtherCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t border-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">Total Transfer Order Amount</span>
                  <span className="text-xl font-bold text-foreground tabular-nums">₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {!canGenerate && <p className="text-xs text-muted-foreground text-right">Complete required fields to generate Transfer Order.</p>}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" disabled={!hasItems} className={cn("bg-background min-w-[100px]", !hasItems && "opacity-40 cursor-not-allowed")} onClick={handleDraft}>Save as Draft</Button>
                <Button variant="cento" disabled={!canGenerate} className={cn("min-w-[120px]", !canGenerate && "opacity-40 cursor-not-allowed")} onClick={handleGenerate}>Generate Transfer Order</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MaterialSelectionModal open={materialModalOpen} onClose={() => setMaterialModalOpen(false)} existingMaterialIds={lineItems.map((li) => li.materialId)} onAddMaterials={addMaterialsFromModal} />
    </div>
  );
}
