import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Factory, Search, Plus, Trash2, ArrowLeft, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useProductionStore, type ProductionPlanItem, type StockRequirementItem, type RecipeItem } from "@/context/ProductionStoreContext";
import { format } from "date-fns";

const MOCK_MATERIALS = [
  { id: "m1", code: "RM-001", name: "Basmati Rice", category: "Grains", unit: "KG", costPerUnit: 85 },
  { id: "m2", code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", unit: "LTR", costPerUnit: 620 },
  { id: "m3", code: "RM-003", name: "Chicken Breast", category: "Meat", unit: "KG", costPerUnit: 280 },
  { id: "m4", code: "RM-004", name: "Onion (Red)", category: "Vegetables", unit: "KG", costPerUnit: 35 },
  { id: "m7", code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", unit: "KG", costPerUnit: 520 },
  { id: "m8", code: "RM-008", name: "All-Purpose Flour", category: "Grains", unit: "KG", costPerUnit: 42 },
  { id: "m9", code: "RM-009", name: "Garlic", category: "Vegetables", unit: "KG", costPerUnit: 120 },
];

const MOCK_FINISHED_GOODS = [
  { code: "FG-001", name: "White Bread Loaf", category: "Bakery", unit: "PCS", recipeItems: [{ materialId: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", quantity: 0.25 }, { materialId: "RM-002", materialName: "Olive Oil", category: "Oils", unit: "LTR", quantity: 0.02 }] },
  { code: "FG-002", name: "Garlic Bread", category: "Bakery", unit: "PCS", recipeItems: [{ materialId: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", quantity: 0.24 }, { materialId: "RM-009", materialName: "Garlic", category: "Vegetables", unit: "KG", quantity: 0.06 }] },
  { code: "FG-003", name: "Paneer Tikka", category: "Ready-to-Cook", unit: "KG", recipeItems: [{ materialId: "RM-007", materialName: "Mozzarella Cheese", category: "Dairy", unit: "KG", quantity: 0.125 }] },
  { code: "FG-004", name: "Biryani Rice Mix", category: "Ready-to-Cook", unit: "KG", recipeItems: [{ materialId: "RM-001", materialName: "Basmati Rice", category: "Grains", unit: "KG", quantity: 0.25 }, { materialId: "RM-004", materialName: "Onion (Red)", category: "Vegetables", unit: "KG", quantity: 0.083 }] },
];

const MOCK_CATEGORIES = ["Bakery", "Ready-to-Cook", "Snacks", "Beverages"];

interface PlanItem extends ProductionPlanItem {
  id: string;
}

function MaterialSelectionModal({ open, onClose, existingCodes, onAdd }: { open: boolean; onClose: () => void; existingCodes: string[]; onAdd: (codes: string[]) => void }) {
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set(existingCodes));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "selected">("all");

  useEffect(() => { if (open) { setSelectedCodes(new Set(existingCodes)); setSearchQuery(""); setViewMode("all"); } }, [open, existingCodes]);

  const categories = useMemo(() => {
    const cats: Record<string, typeof MOCK_FINISHED_GOODS> = {};
    MOCK_FINISHED_GOODS.forEach((m) => { if (!cats[m.category]) cats[m.category] = []; cats[m.category].push(m); });
    return cats;
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const result: Record<string, typeof MOCK_FINISHED_GOODS> = {};
    Object.entries(categories).forEach(([cat, mats]) => {
      const filteredMats = mats.filter((m) => {
        if (viewMode === "selected" && !selectedCodes.has(m.code)) return false;
        if (!q) return true;
        return cat.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
      });
      if (filteredMats.length > 0) result[cat] = filteredMats;
    });
    return result;
  }, [categories, searchQuery, viewMode, selectedCodes]);

  const toggle = (code: string) => setSelectedCodes((prev) => { const n = new Set(prev); if (n.has(code)) n.delete(code); else n.add(code); return n; });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>Add Materials</DialogTitle></DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
            <button onClick={() => setViewMode("all")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>All</button>
            <button onClick={() => setViewMode("selected")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "selected" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>Selected ({selectedCodes.size})</button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto border border-border rounded-lg py-2">
          {Object.entries(filteredCategories).map(([cat, mats]) => (
            <div key={cat} className="mb-3">
              <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
              {mats.map((m) => (
                <button key={m.code} onClick={() => toggle(m.code)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors text-left", selectedCodes.has(m.code) && "bg-cento-yellow-tint")}>
                  <Checkbox checked={selectedCodes.has(m.code)} onCheckedChange={() => toggle(m.code)} className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{m.code}</span>
                  <span className="font-medium text-sm flex-1 truncate">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.unit}</span>
                </button>
              ))}
            </div>
          ))}
          {Object.keys(filteredCategories).length === 0 && <div className="text-center py-8 text-sm text-muted-foreground">No materials found</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="cento" onClick={() => { onAdd(Array.from(selectedCodes)); onClose(); }}>Add {selectedCodes.size} Material{selectedCodes.size !== 1 ? "s" : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NewProduction() {
  const navigate = useNavigate();
  const { addProduction } = useProductionStore();
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [planSearch, setPlanSearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [recipeModalItem, setRecipeModalItem] = useState<PlanItem | null>(null);

  const stockRequirements = useMemo<StockRequirementItem[]>(() => {
    const usage: Record<string, StockRequirementItem> = {};
    planItems.forEach((item) => {
      item.recipeItems.forEach((r) => {
        const qty = r.quantity * item.productionQty;
        const mat = MOCK_MATERIALS.find((m) => m.code === r.materialId);
        if (usage[r.materialId]) {
          usage[r.materialId].stockUsage += qty;
          usage[r.materialId].usageCost = usage[r.materialId].stockUsage * usage[r.materialId].costPerUnit;
        } else {
          usage[r.materialId] = {
            materialCode: r.materialId, materialName: r.materialName, category: r.category, unit: r.unit,
            costPerUnit: mat?.costPerUnit ?? 0, stockUsage: qty, usageCost: qty * (mat?.costPerUnit ?? 0),
          };
        }
      });
    });
    return Object.values(usage);
  }, [planItems]);

  const filteredPlan = useMemo(() => {
    if (!planSearch.trim()) return planItems;
    const q = planSearch.toLowerCase();
    return planItems.filter((p) => p.materialName.toLowerCase().includes(q) || p.materialCode.toLowerCase().includes(q));
  }, [planItems, planSearch]);

  const filteredStock = useMemo(() => {
    if (!stockSearch.trim()) return stockRequirements;
    const q = stockSearch.toLowerCase();
    return stockRequirements.filter((s) => s.materialName.toLowerCase().includes(q) || s.materialCode.toLowerCase().includes(q));
  }, [stockRequirements, stockSearch]);

  const addMaterialsFromModal = useCallback((codes: string[]) => {
    setPlanItems((prev) => {
      const existingCodes = new Set(prev.map((p) => p.materialCode));
      const selectedSet = new Set(codes);
      const filtered = prev.filter((p) => selectedSet.has(p.materialCode));
      codes.forEach((code) => {
        if (existingCodes.has(code)) return;
        const fg = MOCK_FINISHED_GOODS.find((m) => m.code === code);
        if (!fg) return;
        filtered.push({
          id: crypto.randomUUID(), materialCode: fg.code, materialName: fg.name, category: fg.category, unit: fg.unit,
          productionQty: 0, batchName: "", expiryDate: "", recipeItems: fg.recipeItems,
        });
      });
      return filtered;
    });
  }, []);

  const updatePlanItem = (id: string, updates: Partial<PlanItem>) => {
    setPlanItems((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  };

  const removePlanItem = (id: string) => setPlanItems((prev) => prev.filter((p) => p.id !== id));

  const handleSave = () => {
    if (planItems.length === 0) return;
    addProduction({
      productionPlan: "New Production", productionDate: format(new Date(), "yyyy-MM-dd"), producedBy: "Admin",
      totalProduced: planItems.reduce((s, p) => s + p.productionQty, 0), deleted: false,
      planItems: planItems.map(({ id, ...rest }) => rest), stockRequirements,
    });
    toast({ title: "Production Saved", description: "New production has been logged." });
    navigate("/operations/productions");
  };

  return (
    <div className="space-y-5 max-w-[1100px] pb-28">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
          <Factory className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="cento-page-title">New Production</h2>
          <p className="cento-helper mt-0.5">Log a new production batch</p>
        </div>
      </div>

      {/* Production Plan */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Production Plan</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input value={planSearch} onChange={(e) => setPlanSearch(e.target.value)} placeholder="Search plan..." className="pl-8 h-8 text-xs bg-background" />
              </div>
              <Button variant="cento" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setMaterialModalOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Material
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Material Code</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Production Qty</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead className="w-[80px]">Recipe</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlan.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-14 text-muted-foreground text-sm">Click "Add Material" to start</TableCell></TableRow>
              ) : filteredPlan.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.materialCode}</TableCell>
                  <TableCell className="font-medium">{item.materialName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell><Input type="number" min={0} value={item.productionQty || ""} onChange={(e) => updatePlanItem(item.id, { productionQty: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                  <TableCell><Input value={item.batchName} onChange={(e) => updatePlanItem(item.id, { batchName: e.target.value })} className="w-28 h-8 text-sm bg-background" placeholder="Batch" /></TableCell>
                  <TableCell><Input type="date" value={item.expiryDate} onChange={(e) => updatePlanItem(item.id, { expiryDate: e.target.value })} className="w-36 h-8 text-sm bg-background" /></TableCell>
                  <TableCell><Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setRecipeModalItem(item)}><Eye className="h-3 w-3" /> View</Button></TableCell>
                  <TableCell><button onClick={() => removePlanItem(item.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive/70" /></button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Requirement */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Stock Requirement</CardTitle>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Search stock..." className="pl-8 h-8 text-xs bg-background" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Material Code</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Cost/Unit</TableHead>
                <TableHead className="text-right">Stock Usage</TableHead>
                <TableHead className="text-right">Usage Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStock.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Stock requirements will appear as you add materials.</TableCell></TableRow>
              ) : filteredStock.map((item, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{item.materialCode}</TableCell>
                  <TableCell className="font-medium">{item.materialName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">₹{item.costPerUnit}</TableCell>
                  <TableCell className="text-right">{item.stockUsage.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">₹{item.usageCost.toFixed(0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CTAs */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
        <div className="max-w-[1100px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/operations/productions")}>Cancel</Button>
          <Button variant="cento" size="sm" disabled={planItems.length === 0} onClick={handleSave}>Save</Button>
        </div>
      </div>

      {/* Recipe Modal */}
      <Dialog open={!!recipeModalItem} onOpenChange={(o) => { if (!o) setRecipeModalItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Items included in the recipe — {recipeModalItem?.materialName}</DialogTitle></DialogHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Material ID</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipeModalItem?.recipeItems.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.materialId}</TableCell>
                  <TableCell className="font-medium">{r.materialName}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell>{r.unit}</TableCell>
                  <TableCell className="text-right">{r.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <MaterialSelectionModal open={materialModalOpen} onClose={() => setMaterialModalOpen(false)} existingCodes={planItems.map((p) => p.materialCode)} onAdd={addMaterialsFromModal} />
    </div>
  );
}
