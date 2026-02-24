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

interface StockRow { outletId: string; outletName: string; openingStock: number; openingStockPrice: number; map: number; transferPrice: number; consumptionEnabled: boolean; }

interface MaterialForm {
  type: "Raw" | "Processed"; name: string; category: string; externalCode: string; description: string;
  primaryUnit: string; secondaryUnit: string; supportsBatching: boolean; expiryBased: boolean; shelfLife: number;
  stockRows: StockRow[];
}

const emptyForm: MaterialForm = {
  type: "Raw", name: "", category: "", externalCode: "", description: "",
  primaryUnit: "", secondaryUnit: "", supportsBatching: false, expiryBased: false, shelfLife: 0, stockRows: [],
};

function MaterialFormSection({ form, setForm, isEdit }: { form: MaterialForm; setForm: (f: MaterialForm) => void; isEdit?: boolean }) {
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
      {/* 1. Basic Information */}
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

      {/* 2. Units */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Units</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Primary Unit</Label>
            <Select value={form.primaryUnit} onValueChange={(v) => setForm({ ...form, primaryUnit: v })}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Secondary Unit</Label>
            <Select value={form.secondaryUnit} onValueChange={(v) => setForm({ ...form, secondaryUnit: v })}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3-5. Batching, Expiry, Shelf Life */}
      <div className="grid grid-cols-3 gap-6">
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <Label className="text-xs">Supports Batching</Label>
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button key={String(v)} onClick={() => setForm({ ...form, supportsBatching: v })} className={cn("px-3 py-1 text-xs rounded-md border transition-all", form.supportsBatching === v ? "border-primary bg-cento-yellow-tint" : "border-border text-muted-foreground")}>{v ? "Yes" : "No"}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <Label className="text-xs">Expiry Based Consumption</Label>
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button key={String(v)} onClick={() => setForm({ ...form, expiryBased: v })} className={cn("px-3 py-1 text-xs rounded-md border transition-all", form.expiryBased === v ? "border-primary bg-cento-yellow-tint" : "border-border text-muted-foreground")}>{v ? "Yes" : "No"}</button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Shelf Life</Label>
          <div className="relative mt-1">
            <Input type="number" min={0} value={form.shelfLife || ""} onChange={(e) => setForm({ ...form, shelfLife: parseInt(e.target.value) || 0 })} className="h-9 text-sm pr-12" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Days</span>
          </div>
        </div>
      </div>

      {/* 6. Stock Information */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Stock Information</h4>
        <div className="relative w-64 mb-3">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search & add outlet..." value={outletSearch} onChange={(e) => setOutletSearch(e.target.value)} className="pl-8 h-9 text-xs" />
          {outletSearch && availableOutlets.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[160px] overflow-auto">
              {availableOutlets.map((o) => (
                <button key={o.id} onMouseDown={() => addOutletRow(o.id)} className="w-full px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors">{o.name}</button>
              ))}
            </div>
          )}
        </div>
        {form.stockRows.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Outlet Name</TableHead>
                  <TableHead className="text-right">Opening Stock</TableHead>
                  <TableHead className="text-right">Opening Stock Price</TableHead>
                  <TableHead className="text-right">MAP</TableHead>
                  <TableHead className="text-right">Transfer Price</TableHead>
                  <TableHead>Consumption</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {form.stockRows.map((row) => (
                  <TableRow key={row.outletId}>
                    <TableCell className="font-medium text-sm">{row.outletName}</TableCell>
                    <TableCell><Input type="number" min={0} value={row.openingStock || ""} onChange={(e) => updateStockRow(row.outletId, { openingStock: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell><Input type="number" min={0} value={row.openingStockPrice || ""} onChange={(e) => updateStockRow(row.outletId, { openingStockPrice: parseFloat(e.target.value) || 0 })} className="w-24 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell><Input type="number" min={0} value={row.map || ""} onChange={(e) => updateStockRow(row.outletId, { map: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground tabular-nums">{row.transferPrice || row.map || "—"}</span>
                        <button onClick={() => openTransferPriceModal(row.outletId)} className="p-1 rounded hover:bg-muted/60"><Pencil className="h-3 w-3 text-muted-foreground" /></button>
                      </div>
                    </TableCell>
                    <TableCell><Switch checked={row.consumptionEnabled} onCheckedChange={(v) => updateStockRow(row.outletId, { consumptionEnabled: v })} /></TableCell>
                    <TableCell><button onClick={() => removeStockRow(row.outletId)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Transfer Price Modal */}
      <Dialog open={!!transferPriceModal} onOpenChange={() => setTransferPriceModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Transfer Price</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <button onClick={() => setTpMode("sameAsMap")} className={cn("w-full text-left p-3 rounded-lg border text-sm transition-all", tpMode === "sameAsMap" ? "border-primary bg-cento-yellow-tint" : "border-border")}>Same as MAP</button>
            <div className={cn("p-3 rounded-lg border transition-all", tpMode === "margin" ? "border-primary bg-cento-yellow-tint" : "border-border")}>
              <button onClick={() => setTpMode("margin")} className="text-sm font-medium w-full text-left">Add Margin on MAP</button>
              {tpMode === "margin" && (
                <div className="mt-2 relative"><Input type="number" value={tpMargin || ""} onChange={(e) => setTpMargin(parseFloat(e.target.value) || 0)} className="h-8 text-sm pr-8" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span></div>
              )}
            </div>
            <div className={cn("p-3 rounded-lg border transition-all", tpMode === "custom" ? "border-primary bg-cento-yellow-tint" : "border-border")}>
              <button onClick={() => setTpMode("custom")} className="text-sm font-medium w-full text-left">Custom Price</button>
              {tpMode === "custom" && (
                <div className="mt-2 relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span><Input type="number" value={tpCustom || ""} onChange={(e) => setTpCustom(parseFloat(e.target.value) || 0)} className="h-8 text-sm pl-6" /></div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTransferPriceModal(null)}>Cancel</Button>
            <Button variant="cento" size="sm" onClick={saveTransferPrice}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SettingsContentProps { title: string; }

function SettingsContent({ title }: SettingsContentProps) {
  return (
    <div className="space-y-5">
      <h2 className="cento-page-title">{title}</h2>
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Configuration</h3>
        <div className="cento-empty-state">
          <div className="h-10 w-10 rounded-xl bg-cento-yellow-tint flex items-center justify-center mb-3">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">Configure your {title.toLowerCase()} settings here.</p>
        </div>
      </div>
    </div>
  );
}

function MaterialManagementContent({ editMaterialCode }: { editMaterialCode?: string }) {
  const [addMode, setAddMode] = useState<"manual" | "import">("manual");
  const [addForm, setAddForm] = useState<MaterialForm>({ ...emptyForm });
  const [editSearch, setEditSearch] = useState("");
  const [editMaterial, setEditMaterial] = useState<string | null>(editMaterialCode ?? null);
  const [editForm, setEditForm] = useState<MaterialForm>({ ...emptyForm });

  // Load edit material
  useEffect(() => {
    if (editMaterial) {
      const mat = MOCK_MATERIALS_DB.find((m) => m.code === editMaterial);
      if (mat) {
        setEditForm({
          type: mat.type as "Raw" | "Processed", name: mat.name, category: mat.category,
          externalCode: mat.externalCode, description: mat.description,
          primaryUnit: mat.primaryUnit, secondaryUnit: mat.secondaryUnit,
          supportsBatching: mat.supportsBatching, expiryBased: mat.expiryBased,
          shelfLife: mat.shelfLife, stockRows: [],
        });
      }
    }
  }, [editMaterial]);

  const filteredMaterials = useMemo(() => {
    if (!editSearch.trim()) return MOCK_MATERIALS_DB;
    const q = editSearch.toLowerCase();
    return MOCK_MATERIALS_DB.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [editSearch]);

  return (
    <div className="space-y-8">
      <h2 className="cento-page-title">Material Management</h2>

      {/* ADD MATERIAL SECTION */}
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
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Help & Instructions</p>
                <p>• Download the sample sheet.</p>
                <p>• Follow the instructions in the sample sheet for validations.</p>
                <p>• Paste material data in sample sheet with specified format.</p>
                <p>• Upload the edited sheet for creation of materials.</p>
              </div>
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
              <Button variant="outline" size="sm" onClick={() => setAddForm({ ...emptyForm })}>Cancel</Button>
              <Button variant="cento" size="sm" onClick={() => { toast({ title: "Material Added", description: `${addForm.name || "Material"} has been added.` }); setAddForm({ ...emptyForm }); }}>Add Material</Button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT MATERIAL SECTION */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Edit Material</h3>
        {!editMaterial ? (
          <div className="space-y-3">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search material to edit..." value={editSearch} onChange={(e) => setEditSearch(e.target.value)} className="pl-8 h-9 text-xs" />
            </div>
            {editSearch && (
              <div className="border border-border rounded-lg max-h-[200px] overflow-auto">
                {filteredMaterials.map((m) => (
                  <button key={m.code} onClick={() => setEditMaterial(m.code)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0">
                    <span className="font-mono text-xs text-muted-foreground">{m.code}</span>
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{m.type}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Search and select a material to edit its details.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Editing: <span className="text-primary">{editMaterial}</span></p>
              <button onClick={() => { setEditMaterial(null); setEditSearch(""); }} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button>
            </div>
            <MaterialFormSection form={editForm} setForm={setEditForm} isEdit />
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setEditMaterial(null); setEditSearch(""); }}>Cancel</Button>
              <Button variant="cento" size="sm" onClick={() => { toast({ title: "Material Updated", description: `${editForm.name} has been updated.` }); setEditMaterial(null); setEditSearch(""); }}>Update</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const location = useLocation();
  const sectionFromState = (location.state as { section?: string; editMaterial?: string } | null)?.section;
  const editMaterialCode = (location.state as { editMaterial?: string } | null)?.editMaterial;
  const [activeSection, setActiveSection] = useState(sectionFromState || settingsSubModules[0].path);

  const activeSub = settingsSubModules.find((s) => s.path === activeSection);
  const isMaterialManagement = activeSection === "/settings/material-management";

  return (
    <div className="flex h-full -m-6">
      <div className="w-60 border-r border-border bg-card overflow-y-auto py-4 shrink-0">
        <div className="px-4 pb-3">
          <span className="cento-section-header">Settings</span>
        </div>
        {settingsSubModules.map((sub) => (
          <button
            key={sub.path}
            onClick={() => setActiveSection(sub.path)}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm transition-all cursor-pointer relative",
              "hover:bg-cento-yellow-tint",
              activeSection === sub.path ? "text-foreground font-medium bg-cento-yellow-tint" : "text-muted-foreground"
            )}
          >
            {activeSection === sub.path && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cento-yellow rounded-l-full" />
            )}
            {sub.title}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {isMaterialManagement ? (
          <MaterialManagementContent editMaterialCode={editMaterialCode} />
        ) : (
          activeSub && <SettingsContent title={activeSub.title} />
        )}
      </div>
    </div>
  );
}
