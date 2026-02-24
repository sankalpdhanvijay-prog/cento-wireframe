import { useState, useMemo, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { settingsSubModules } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Settings as SettingsIcon, Upload, Download, Plus, Trash2, Pencil, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

const MOCK_CATEGORIES = ["Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood", "Packaging", "Beverages"];
const MOCK_UNITS = ["KG", "LTR", "PCS", "GM", "ML", "DOZ", "PKT", "BOX"];
const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

const MOCK_MATERIALS_DB = [
  { code: "RM-001", name: "Basmati Rice", type: "Raw", category: "Grains", primaryUnit: "KG", secondaryUnit: "GM", externalCode: "BR-100", description: "Premium long grain", supportsBatching: true, expiryBased: false, shelfLife: 180 },
  { code: "RM-002", name: "Olive Oil (Extra Virgin)", type: "Raw", category: "Oils", primaryUnit: "LTR", secondaryUnit: "ML", externalCode: "OO-200", description: "Cold pressed", supportsBatching: false, expiryBased: true, shelfLife: 365 },
  { code: "RM-003", name: "Chicken Breast", type: "Raw", category: "Meat", primaryUnit: "KG", secondaryUnit: "GM", externalCode: "CB-300", description: "Boneless", supportsBatching: true, expiryBased: true, shelfLife: 3 },
  { code: "RM-005", name: "Tomato Paste", type: "Processed", category: "Sauces", primaryUnit: "KG", secondaryUnit: "GM", externalCode: "TP-500", description: "Triple concentrated", supportsBatching: true, expiryBased: true, shelfLife: 90 },
  { code: "RM-007", name: "Mozzarella Cheese", type: "Processed", category: "Dairy", primaryUnit: "KG", secondaryUnit: "GM", externalCode: "MC-700", description: "Fresh block", supportsBatching: true, expiryBased: true, shelfLife: 14 },
];

const MOCK_VENDORS_DB = [
  { id: "VN1", name: "Fresh Farms Pvt Ltd", contactPerson: "Raj Kumar", phone: "9876543210", email: "raj@freshfarms.in", gstin: "29ABCDE1234F1Z5", address: "HSR Layout, Bangalore", externalId: "VN-EXT-001", allowTotalAmount: true, materials: [
    { code: "RM-001", name: "Basmati Rice", category: "Grains", buyingUnit: "KG", buyingPrice: 80, loosePricing: false },
    { code: "RM-004", name: "Onion (Red)", category: "Vegetables", buyingUnit: "KG", buyingPrice: 30, loosePricing: true },
  ]},
  { id: "VN2", name: "Spice World Trading", contactPerson: "Anjali S", phone: "9123456789", email: "info@spiceworld.in", gstin: "29FGHIJ5678K2Z6", address: "Commercial Street, Bangalore", externalId: "VN-EXT-002", allowTotalAmount: false, materials: [
    { code: "RM-006", name: "Cumin Powder", category: "Spices", buyingUnit: "KG", buyingPrice: 340, loosePricing: false },
  ]},
  { id: "VN3", name: "Ocean Catch Seafood", contactPerson: "John D", phone: "9988776655", email: "john@oceancatch.in", gstin: "29KLMNO9012P3Z7", address: "Russell Market, Bangalore", externalId: "VN-EXT-003", allowTotalAmount: true, materials: [] },
];

// ── Material types ──
interface StockRow { outletId: string; outletName: string; openingStock: number; openingStockPrice: number; map: number; transferPrice: number; consumptionEnabled: boolean; }
interface MaterialForm {
  type: "Raw" | "Processed"; name: string; category: string; externalCode: string; description: string;
  primaryUnit: string; secondaryUnit: string; supportsBatching: boolean; expiryBased: boolean; shelfLife: number;
  stockRows: StockRow[];
}
const emptyMaterialForm: MaterialForm = {
  type: "Raw", name: "", category: "", externalCode: "", description: "",
  primaryUnit: "", secondaryUnit: "", supportsBatching: false, expiryBased: false, shelfLife: 0, stockRows: [],
};

// ── Vendor types ──
interface VendorMaterialRow { code: string; name: string; category: string; buyingUnit: string; buyingPrice: number; loosePricing: boolean; }
interface VendorForm {
  name: string; contactPerson: string; phone: string; email: string; gstin: string; address: string; externalId: string;
  allowTotalAmount: boolean;
  siteActivation: { outletId: string; outletName: string; active: boolean }[];
  materials: VendorMaterialRow[];
}
const emptyVendorForm: VendorForm = {
  name: "", contactPerson: "", phone: "", email: "", gstin: "", address: "", externalId: "",
  allowTotalAmount: false,
  siteActivation: MOCK_OUTLETS.map((o) => ({ outletId: o.id, outletName: o.name, active: false })),
  materials: [],
};

// ══════════════════════════════════════════════════════════════
// MaterialFormSection (unchanged from before)
// ══════════════════════════════════════════════════════════════
function MaterialFormSection({ form, setForm }: { form: MaterialForm; setForm: (f: MaterialForm) => void }) {
  const [outletSearch, setOutletSearch] = useState("");
  const [transferPriceModal, setTransferPriceModal] = useState<string | null>(null);
  const [tpMode, setTpMode] = useState<"sameAsMap" | "margin" | "custom">("sameAsMap");
  const [tpMargin, setTpMargin] = useState(0);
  const [tpCustom, setTpCustom] = useState(0);

  const availableOutlets = useMemo(() => {
    const usedIds = new Set(form.stockRows.map((r) => r.outletId));
    return MOCK_OUTLETS.filter((o) => !usedIds.has(o.id) && o.name.toLowerCase().includes(outletSearch.toLowerCase()));
  }, [form.stockRows, outletSearch]);

  const addOutletRow = (outletId: string) => {
    const outlet = MOCK_OUTLETS.find((o) => o.id === outletId);
    if (!outlet) return;
    setForm({ ...form, stockRows: [...form.stockRows, { outletId, outletName: outlet.name, openingStock: 0, openingStockPrice: 0, map: 0, transferPrice: 0, consumptionEnabled: true }] });
    setOutletSearch("");
  };
  const updateStockRow = (outletId: string, updates: Partial<StockRow>) => {
    setForm({ ...form, stockRows: form.stockRows.map((r) => r.outletId === outletId ? { ...r, ...updates } : r) });
  };
  const removeStockRow = (outletId: string) => {
    setForm({ ...form, stockRows: form.stockRows.filter((r) => r.outletId !== outletId) });
  };
  const openTransferPriceModal = (outletId: string) => {
    const row = form.stockRows.find((r) => r.outletId === outletId);
    setTpMode("sameAsMap"); setTpMargin(0); setTpCustom(row?.transferPrice ?? 0);
    setTransferPriceModal(outletId);
  };
  const saveTransferPrice = () => {
    if (!transferPriceModal) return;
    const row = form.stockRows.find((r) => r.outletId === transferPriceModal);
    if (!row) return;
    let price = row.map;
    if (tpMode === "margin") price = row.map + (row.map * tpMargin / 100);
    else if (tpMode === "custom") price = tpCustom;
    updateStockRow(transferPriceModal, { transferPrice: price });
    setTransferPriceModal(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Basic Information</h4>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Type</Label>
            <div className="flex gap-2 mt-1">
              {(["Raw", "Processed"] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t })} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", form.type === t ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-xs">Material Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Enter material name" /></div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{MOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">External Code</Label><Input value={form.externalCode} onChange={(e) => setForm({ ...form, externalCode: e.target.value })} className="mt-1 h-9 text-sm" placeholder="External code" /></div>
            <div><Label className="text-xs">Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Description" /></div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Units</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs">Primary Unit</Label><Select value={form.primaryUnit} onValueChange={(v) => setForm({ ...form, primaryUnit: v })}><SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs">Secondary Unit</Label><Select value={form.secondaryUnit} onValueChange={(v) => setForm({ ...form, secondaryUnit: v })}><SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <Label className="text-xs">Supports Batching</Label>
          <div className="flex gap-2">{[true, false].map((v) => (<button key={String(v)} onClick={() => setForm({ ...form, supportsBatching: v })} className={cn("px-3 py-1 text-xs rounded-md border transition-all", form.supportsBatching === v ? "border-primary bg-cento-yellow-tint" : "border-border text-muted-foreground")}>{v ? "Yes" : "No"}</button>))}</div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <Label className="text-xs">Expiry Based</Label>
          <div className="flex gap-2">{[true, false].map((v) => (<button key={String(v)} onClick={() => setForm({ ...form, expiryBased: v })} className={cn("px-3 py-1 text-xs rounded-md border transition-all", form.expiryBased === v ? "border-primary bg-cento-yellow-tint" : "border-border text-muted-foreground")}>{v ? "Yes" : "No"}</button>))}</div>
        </div>
        <div><Label className="text-xs">Shelf Life</Label><div className="relative mt-1"><Input type="number" min={0} value={form.shelfLife || ""} onChange={(e) => setForm({ ...form, shelfLife: parseInt(e.target.value) || 0 })} className="h-9 text-sm pr-12" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Days</span></div></div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Stock Information</h4>
        <div className="relative w-64 mb-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search & add outlet..." value={outletSearch} onChange={(e) => setOutletSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          {outletSearch && availableOutlets.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[160px] overflow-auto">
              {availableOutlets.map((o) => (<button key={o.id} onMouseDown={() => addOutletRow(o.id)} className="w-full px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors">{o.name}</button>))}
            </div>
          )}
        </div>
        {form.stockRows.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead>Outlet Name</TableHead><TableHead className="text-right">Opening Stock</TableHead><TableHead className="text-right">Opening Stock Price</TableHead><TableHead className="text-right">MAP</TableHead><TableHead className="text-right">Transfer Price</TableHead><TableHead>Consumption</TableHead><TableHead className="w-10" /></TableRow></TableHeader>
              <TableBody>
                {form.stockRows.map((row) => (
                  <TableRow key={row.outletId}>
                    <TableCell className="font-medium text-sm">{row.outletName}</TableCell>
                    <TableCell><Input type="number" min={0} value={row.openingStock || ""} onChange={(e) => updateStockRow(row.outletId, { openingStock: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell><Input type="number" min={0} value={row.openingStockPrice || ""} onChange={(e) => updateStockRow(row.outletId, { openingStockPrice: parseFloat(e.target.value) || 0 })} className="w-24 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell><Input type="number" min={0} value={row.map || ""} onChange={(e) => updateStockRow(row.outletId, { map: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell><div className="flex items-center gap-1"><span className="text-sm text-muted-foreground tabular-nums">{row.transferPrice || row.map || "—"}</span><button onClick={() => openTransferPriceModal(row.outletId)} className="p-1 rounded hover:bg-muted/60"><Pencil className="h-3 w-3 text-muted-foreground" /></button></div></TableCell>
                    <TableCell><Switch checked={row.consumptionEnabled} onCheckedChange={(v) => updateStockRow(row.outletId, { consumptionEnabled: v })} /></TableCell>
                    <TableCell><button onClick={() => removeStockRow(row.outletId)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!transferPriceModal} onOpenChange={() => setTransferPriceModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Transfer Price</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <button onClick={() => setTpMode("sameAsMap")} className={cn("w-full text-left p-3 rounded-lg border text-sm transition-all", tpMode === "sameAsMap" ? "border-primary bg-cento-yellow-tint" : "border-border")}>Same as MAP</button>
            <div className={cn("p-3 rounded-lg border transition-all", tpMode === "margin" ? "border-primary bg-cento-yellow-tint" : "border-border")}>
              <button onClick={() => setTpMode("margin")} className="text-sm font-medium w-full text-left">Add Margin on MAP</button>
              {tpMode === "margin" && <div className="mt-2 relative"><Input type="number" value={tpMargin || ""} onChange={(e) => setTpMargin(parseFloat(e.target.value) || 0)} className="h-8 text-sm pr-8" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div>}
            </div>
            <div className={cn("p-3 rounded-lg border transition-all", tpMode === "custom" ? "border-primary bg-cento-yellow-tint" : "border-border")}>
              <button onClick={() => setTpMode("custom")} className="text-sm font-medium w-full text-left">Custom Price</button>
              {tpMode === "custom" && <div className="mt-2 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span><Input type="number" value={tpCustom || ""} onChange={(e) => setTpCustom(parseFloat(e.target.value) || 0)} className="h-8 text-sm pl-6" /></div>}
            </div>
          </div>
          <DialogFooter><Button variant="outline" size="sm" onClick={() => setTransferPriceModal(null)}>Cancel</Button><Button variant="cento" size="sm" onClick={saveTransferPrice}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// VendorFormSection
// ══════════════════════════════════════════════════════════════
function VendorFormSection({ form, setForm }: { form: VendorForm; setForm: (f: VendorForm) => void }) {
  const [materialSearch, setMaterialSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [materialModal, setMaterialModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());
  const [modalViewMode, setModalViewMode] = useState<"all" | "selected">("all");

  const existingCodes = new Set(form.materials.map((m) => m.code));

  // Material modal categories
  const allMaterials = MOCK_MATERIALS_DB;
  const categories = useMemo(() => {
    const cats: Record<string, typeof allMaterials> = {};
    allMaterials.forEach((m) => { (cats[m.category] ??= []).push(m); });
    return cats;
  }, []);

  const filteredModalCategories = useMemo(() => {
    let cats = { ...categories };
    if (modalSearch) {
      const q = modalSearch.toLowerCase();
      const filtered: Record<string, typeof allMaterials> = {};
      Object.entries(cats).forEach(([cat, mats]) => {
        if (cat.toLowerCase().includes(q)) { filtered[cat] = mats; return; }
        const fm = mats.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
        if (fm.length) filtered[cat] = fm;
      });
      cats = filtered;
    }
    if (modalViewMode === "selected") {
      const filtered: Record<string, typeof allMaterials> = {};
      Object.entries(cats).forEach(([cat, mats]) => {
        const fm = mats.filter((m) => modalSelected.has(m.code));
        if (fm.length) filtered[cat] = fm;
      });
      cats = filtered;
    }
    return cats;
  }, [categories, modalSearch, modalViewMode, modalSelected]);

  const openMaterialModal = () => {
    setModalSelected(new Set(form.materials.map((m) => m.code)));
    setModalSearch("");
    setModalViewMode("all");
    setMaterialModal(true);
  };

  const toggleMaterial = (code: string) => {
    const next = new Set(modalSelected);
    if (next.has(code)) next.delete(code); else next.add(code);
    setModalSelected(next);
  };

  const toggleCategory = (cat: string) => {
    const mats = categories[cat] || [];
    const next = new Set(modalSelected);
    const allSelected = mats.every((m) => next.has(m.code));
    mats.forEach((m) => { if (allSelected) next.delete(m.code); else next.add(m.code); });
    setModalSelected(next);
  };

  const confirmMaterialModal = () => {
    const newMats: VendorMaterialRow[] = [];
    modalSelected.forEach((code) => {
      const existing = form.materials.find((m) => m.code === code);
      if (existing) { newMats.push(existing); return; }
      const mat = allMaterials.find((m) => m.code === code);
      if (mat) newMats.push({ code: mat.code, name: mat.name, category: mat.category, buyingUnit: mat.primaryUnit, buyingPrice: 0, loosePricing: false });
    });
    setForm({ ...form, materials: newMats });
    setMaterialModal(false);
  };

  const updateMaterial = (code: string, updates: Partial<VendorMaterialRow>) => {
    setForm({ ...form, materials: form.materials.map((m) => m.code === code ? { ...m, ...updates } : m) });
  };

  const removeMaterial = (code: string) => {
    setForm({ ...form, materials: form.materials.filter((m) => m.code !== code) });
  };

  const filteredTable = useMemo(() => {
    let mats = form.materials;
    if (categoryFilter !== "All") mats = mats.filter((m) => m.category === categoryFilter);
    if (materialSearch) {
      const q = materialSearch.toLowerCase();
      mats = mats.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
    }
    return mats;
  }, [form.materials, materialSearch, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* 1. Vendor Details */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Vendor Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div><Label className="text-xs">Vendor Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Vendor name" /></div>
          <div><Label className="text-xs">Contact Person Name</Label><Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Contact person" /></div>
          <div><Label className="text-xs">Phone</Label><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Phone number" /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Email" /></div>
          <div><Label className="text-xs">GSTIN</Label><Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="mt-1 h-9 text-sm" placeholder="GSTIN" /></div>
          <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 h-9 text-sm" placeholder="Address" /></div>
          <div><Label className="text-xs">External ID</Label><Input value={form.externalId} onChange={(e) => setForm({ ...form, externalId: e.target.value })} className="mt-1 h-9 text-sm" placeholder="External ID" /></div>
        </div>
      </div>

      {/* 2. Configuration */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Configuration</h4>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border max-w-sm">
          <Label className="text-xs">Allow Total Amount Input</Label>
          <Switch checked={form.allowTotalAmount} onCheckedChange={(v) => setForm({ ...form, allowTotalAmount: v })} />
        </div>
      </div>

      {/* 3. Site Activation */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Site Activation</h4>
        <div className="border border-border rounded-lg overflow-hidden max-w-md">
          <Table>
            <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead>Outlet Name</TableHead><TableHead className="w-24">Activation</TableHead></TableRow></TableHeader>
            <TableBody>
              {form.siteActivation.map((sa) => (
                <TableRow key={sa.outletId}>
                  <TableCell className="text-sm">{sa.outletName}</TableCell>
                  <TableCell><Switch checked={sa.active} onCheckedChange={(v) => setForm({ ...form, siteActivation: form.siteActivation.map((s) => s.outletId === sa.outletId ? { ...s, active: v } : s) })} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Material Pricing */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Material Pricing</h4>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search materials in table..." value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{["All", ...MOCK_CATEGORIES].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="cento" size="sm" className="ml-auto gap-1.5 text-xs" onClick={openMaterialModal}><Plus className="h-3.5 w-3.5" /> Add Material</Button>
        </div>
        {form.materials.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/30 hover:bg-muted/30"><TableHead>Code</TableHead><TableHead>Material Name</TableHead><TableHead>Category</TableHead><TableHead>Buying Unit</TableHead><TableHead className="text-right">Buying Price/Unit</TableHead><TableHead className="w-24">Loose Pricing</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
              <TableBody>
                {filteredTable.map((m) => (
                  <TableRow key={m.code}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                    <TableCell className="text-sm font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm">{m.category}</TableCell>
                    <TableCell className="text-sm">{m.buyingUnit}</TableCell>
                    <TableCell><Input type="number" min={0} value={m.buyingPrice || ""} onChange={(e) => updateMaterial(m.code, { buyingPrice: parseFloat(e.target.value) || 0 })} className="w-24 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell className="text-center"><Checkbox checked={m.loosePricing} onCheckedChange={(v) => updateMaterial(m.code, { loosePricing: !!v })} /></TableCell>
                    <TableCell><button onClick={() => removeMaterial(m.code)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Material Selection Modal */}
      <Dialog open={materialModal} onOpenChange={setMaterialModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Add Materials</DialogTitle></DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3">
              <div className="relative flex-1"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search categories or materials..." value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="pl-8 h-9 text-xs" /></div>
              <div className="flex gap-1 bg-muted/40 rounded-lg p-0.5">
                <button onClick={() => setModalViewMode("all")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", modalViewMode === "all" ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}>All</button>
                <button onClick={() => setModalViewMode("selected")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", modalViewMode === "selected" ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}>Selected</button>
              </div>
            </div>
            <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
              <div className="w-48 border-r border-border pr-3 overflow-y-auto shrink-0 space-y-1">
                {Object.entries(filteredModalCategories).map(([cat, mats]) => {
                  const allSel = mats.every((m) => modalSelected.has(m.code));
                  const someSel = mats.some((m) => modalSelected.has(m.code));
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)} className={cn("w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs transition-all", someSel ? "bg-cento-yellow-tint" : "hover:bg-muted/60")}>
                      <Checkbox checked={allSel} className="h-3.5 w-3.5" />
                      <span className="font-medium">{cat}</span>
                      <span className="text-muted-foreground ml-auto">{mats.length}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                <button onClick={() => { const allCodes = Object.values(filteredModalCategories).flat().map((m) => m.code); const next = new Set(modalSelected); const allSel = allCodes.every((c) => next.has(c)); allCodes.forEach((c) => allSel ? next.delete(c) : next.add(c)); setModalSelected(next); }} className="text-xs text-primary font-medium hover:underline mb-2">Select All</button>
                {Object.entries(filteredModalCategories).map(([cat, mats]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{cat}</p>
                    {mats.map((m) => (
                      <button key={m.code} onClick={() => toggleMaterial(m.code)} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-all", modalSelected.has(m.code) ? "bg-cento-yellow-tint" : "hover:bg-muted/40")}>
                        <Checkbox checked={modalSelected.has(m.code)} className="h-3.5 w-3.5" />
                        <span className="font-mono text-muted-foreground">{m.code}</span>
                        <span>{m.name}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" size="sm" onClick={() => setMaterialModal(false)}>Cancel</Button><Button variant="cento" size="sm" onClick={confirmMaterialModal}>Add Selected ({modalSelected.size})</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Settings Content Sections
// ══════════════════════════════════════════════════════════════
function SettingsContent({ title }: { title: string }) {
  return (
    <div className="space-y-5">
      <h2 className="cento-page-title">{title}</h2>
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Configuration</h3>
        <div className="cento-empty-state">
          <div className="h-10 w-10 rounded-xl bg-cento-yellow-tint flex items-center justify-center mb-3"><SettingsIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} /></div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">Configure your {title.toLowerCase()} settings here.</p>
        </div>
      </div>
    </div>
  );
}

function MaterialManagementContent({ editMaterialCode, scrollToEdit }: { editMaterialCode?: string; scrollToEdit?: boolean }) {
  const editRef = useRef<HTMLDivElement>(null);
  const [addMode, setAddMode] = useState<"manual" | "import">("manual");
  const [addForm, setAddForm] = useState<MaterialForm>({ ...emptyMaterialForm });
  const [editSearch, setEditSearch] = useState("");
  const [editMaterial, setEditMaterial] = useState<string | null>(editMaterialCode ?? null);
  const [editForm, setEditForm] = useState<MaterialForm>({ ...emptyMaterialForm });

  useEffect(() => {
    if (editMaterial) {
      const mat = MOCK_MATERIALS_DB.find((m) => m.code === editMaterial);
      if (mat) setEditForm({ type: mat.type as "Raw" | "Processed", name: mat.name, category: mat.category, externalCode: mat.externalCode, description: mat.description, primaryUnit: mat.primaryUnit, secondaryUnit: mat.secondaryUnit, supportsBatching: mat.supportsBatching, expiryBased: mat.expiryBased, shelfLife: mat.shelfLife, stockRows: [] });
    }
  }, [editMaterial]);

  useEffect(() => {
    if ((scrollToEdit || editMaterialCode) && editRef.current) {
      setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [scrollToEdit, editMaterialCode]);

  const filteredMaterials = useMemo(() => {
    if (!editSearch.trim()) return MOCK_MATERIALS_DB;
    const q = editSearch.toLowerCase();
    return MOCK_MATERIALS_DB.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [editSearch]);

  return (
    <div className="space-y-8">
      <h2 className="cento-page-title">Material Management</h2>

      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Add Material</h3>
        <div className="flex gap-2 mb-5">
          <button onClick={() => setAddMode("import")} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", addMode === "import" ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>Import</button>
          <button onClick={() => setAddMode("manual")} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", addMode === "manual" ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>Add Manually</button>
        </div>
        {addMode === "import" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-5 bg-muted/20">
              <p className="text-sm font-medium text-foreground mb-2">Instructions to Upload</p>
              <p className="text-xs text-muted-foreground mb-3">Follow the instructions and import data.</p>
              <div className="space-y-1.5 text-xs text-muted-foreground"><p className="font-medium text-foreground">Help & Instructions</p><p>• Download the sample sheet.</p><p>• Follow the instructions in the sample sheet for validations.</p><p>• Paste material data in sample sheet with specified format.</p><p>• Upload the edited sheet for creation of materials.</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Sample Sheet</Button>
              <Button variant="cento" size="sm" className="gap-1.5 text-xs"><Upload className="h-3.5 w-3.5" /> Upload Sheet</Button>
            </div>
          </div>
        )}
        {addMode === "manual" && (
          <div className="space-y-5">
            <MaterialFormSection form={addForm} setForm={setAddForm} />
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddForm({ ...emptyMaterialForm })}>Cancel</Button>
              <Button variant="cento" size="sm" onClick={() => { toast({ title: "Material Added", description: `${addForm.name || "Material"} has been added.` }); setAddForm({ ...emptyMaterialForm }); }}>Add Material</Button>
            </div>
          </div>
        )}
      </div>

      <div ref={editRef} className="cento-card">
        <h3 className="cento-section-header mb-5">Edit Material</h3>
        {!editMaterial ? (
          <div className="space-y-3">
            <div className="relative w-72"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search material to edit..." value={editSearch} onChange={(e) => setEditSearch(e.target.value)} className="pl-8 h-9 text-xs" /></div>
            {editSearch && (<div className="border border-border rounded-lg max-h-[200px] overflow-auto">{filteredMaterials.map((m) => (<button key={m.code} onClick={() => setEditMaterial(m.code)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0"><span className="font-mono text-xs text-muted-foreground">{m.code}</span><span className="text-sm font-medium">{m.name}</span><span className="text-xs text-muted-foreground ml-auto">{m.type}</span></button>))}</div>)}
            <p className="text-xs text-muted-foreground">Search and select a material to edit its details.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">Editing: <span className="text-primary">{editMaterial}</span></p><button onClick={() => { setEditMaterial(null); setEditSearch(""); }} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button></div>
            <MaterialFormSection form={editForm} setForm={setEditForm} />
            <div className="flex items-center gap-3 pt-2"><Button variant="outline" size="sm" onClick={() => { setEditMaterial(null); setEditSearch(""); }}>Cancel</Button><Button variant="cento" size="sm" onClick={() => { toast({ title: "Material Updated", description: `${editForm.name} has been updated.` }); setEditMaterial(null); setEditSearch(""); }}>Update</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}

function VendorManagementContent({ editVendorId, scrollToEdit }: { editVendorId?: string; scrollToEdit?: boolean }) {
  const editRef = useRef<HTMLDivElement>(null);
  const [addMode, setAddMode] = useState<"manual" | "import">("manual");
  const [addForm, setAddForm] = useState<VendorForm>({ ...emptyVendorForm });
  const [editSearch, setEditSearch] = useState("");
  const [editVendor, setEditVendor] = useState<string | null>(editVendorId ?? null);
  const [editForm, setEditForm] = useState<VendorForm>({ ...emptyVendorForm });

  useEffect(() => {
    if (editVendor) {
      const v = MOCK_VENDORS_DB.find((vn) => vn.id === editVendor);
      if (v) setEditForm({
        name: v.name, contactPerson: v.contactPerson, phone: v.phone, email: v.email, gstin: v.gstin, address: v.address, externalId: v.externalId,
        allowTotalAmount: v.allowTotalAmount,
        siteActivation: MOCK_OUTLETS.map((o) => ({ outletId: o.id, outletName: o.name, active: true })),
        materials: v.materials,
      });
    }
  }, [editVendor]);

  useEffect(() => {
    if ((scrollToEdit || editVendorId) && editRef.current) {
      setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [scrollToEdit, editVendorId]);

  const filteredVendors = useMemo(() => {
    if (!editSearch.trim()) return MOCK_VENDORS_DB;
    const q = editSearch.toLowerCase();
    return MOCK_VENDORS_DB.filter((v) => v.name.toLowerCase().includes(q) || v.id.toLowerCase().includes(q));
  }, [editSearch]);

  return (
    <div className="space-y-8">
      <h2 className="cento-page-title">Vendor Management</h2>

      {/* ADD VENDOR */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Add Vendor</h3>
        <div className="flex gap-2 mb-5">
          <button onClick={() => setAddMode("import")} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", addMode === "import" ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>Import</button>
          <button onClick={() => setAddMode("manual")} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", addMode === "manual" ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>Add Manually</button>
        </div>

        {addMode === "import" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-5 bg-muted/20">
              <p className="text-sm font-medium text-foreground mb-2">Import Vendor Materials</p>
              <p className="text-xs text-muted-foreground mb-3">Follow the instructions and import data.</p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Help & Instructions</p>
                <p>• Download existing Price Configuration data.</p>
                <p>• Follow instructions from the downloaded sheet and update Price configuration as required.</p>
                <p>• Upload the updated price configuration to import.</p>
                <p>• Check and correct for errors if any and proceed to update prices.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Import Vendors</span>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Sample Sheet</Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">Import Vendor Materials</span>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Sample Sheet</Button>
              </div>
            </div>
          </div>
        )}

        {addMode === "manual" && (
          <div className="space-y-5">
            <VendorFormSection form={addForm} setForm={setAddForm} />
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddForm({ ...emptyVendorForm })}>Cancel</Button>
              <Button variant="cento" size="sm" onClick={() => { toast({ title: "Vendor Added", description: `${addForm.name || "Vendor"} has been added.` }); setAddForm({ ...emptyVendorForm }); }}>Add Vendor</Button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT VENDOR */}
      <div ref={editRef} className="cento-card">
        <h3 className="cento-section-header mb-5">Edit Vendor</h3>
        {!editVendor ? (
          <div className="space-y-3">
            <div className="relative w-72"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" /><Input placeholder="Search vendor to edit..." value={editSearch} onChange={(e) => setEditSearch(e.target.value)} className="pl-8 h-9 text-xs" /></div>
            {editSearch && (<div className="border border-border rounded-lg max-h-[200px] overflow-auto">{filteredVendors.map((v) => (<button key={v.id} onClick={() => setEditVendor(v.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0"><span className="font-mono text-xs text-muted-foreground">{v.id}</span><span className="text-sm font-medium">{v.name}</span></button>))}</div>)}
            <p className="text-xs text-muted-foreground">Search and select a vendor to edit its details.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between"><p className="text-sm font-medium">Editing: <span className="text-primary">{editVendor}</span></p><button onClick={() => { setEditVendor(null); setEditSearch(""); }} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button></div>
            <VendorFormSection form={editForm} setForm={setEditForm} />
            <div className="flex items-center gap-3 pt-2"><Button variant="outline" size="sm" onClick={() => { setEditVendor(null); setEditSearch(""); }}>Cancel</Button><Button variant="cento" size="sm" onClick={() => { toast({ title: "Vendor Updated", description: `${editForm.name} has been updated.` }); setEditVendor(null); setEditSearch(""); }}>Update</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Settings
// ══════════════════════════════════════════════════════════════
export default function Settings() {
  const location = useLocation();
  const state = location.state as { section?: string; editMaterial?: string; editVendor?: string; scrollToEdit?: boolean } | null;
  const sectionFromState = state?.section;
  const editMaterialCode = state?.editMaterial;
  const editVendorId = state?.editVendor;
  const scrollToEdit = state?.scrollToEdit;
  const [activeSection, setActiveSection] = useState(sectionFromState || settingsSubModules[0].path);

  const activeSub = settingsSubModules.find((s) => s.path === activeSection);
  const isMaterialManagement = activeSection === "/settings/material-management";
  const isVendorManagement = activeSection === "/settings/vendor-management";

  return (
    <div className="flex h-full -m-6">
      <div className="w-60 border-r border-border bg-card overflow-y-auto py-4 shrink-0">
        <div className="px-4 pb-3"><span className="cento-section-header">Settings</span></div>
        {settingsSubModules.map((sub) => (
          <button key={sub.path} onClick={() => setActiveSection(sub.path)} className={cn("w-full text-left px-4 py-2.5 text-sm transition-all cursor-pointer relative", "hover:bg-cento-yellow-tint", activeSection === sub.path ? "text-foreground font-medium bg-cento-yellow-tint" : "text-muted-foreground")}>
            {activeSection === sub.path && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cento-yellow rounded-l-full" />}
            {sub.title}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {isMaterialManagement ? (
          <MaterialManagementContent editMaterialCode={editMaterialCode} scrollToEdit={scrollToEdit} />
        ) : isVendorManagement ? (
          <VendorManagementContent editVendorId={editVendorId} scrollToEdit={scrollToEdit} />
        ) : (
          activeSub && <SettingsContent title={activeSub.title} />
        )}
      </div>
    </div>
  );
}
