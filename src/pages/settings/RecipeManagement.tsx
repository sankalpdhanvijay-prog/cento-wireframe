import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Plus, Trash2, Upload, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MOCK_OUTLETS = [
  { id: "all", name: "All Outlets" },
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

const MOCK_MATERIALS_DB = [
  { code: "RM-001", name: "Basmati Rice", type: "Raw" as const, category: "Grains", primaryUnit: "KG", price: 85 },
  { code: "RM-002", name: "Olive Oil (Extra Virgin)", type: "Raw" as const, category: "Oils", primaryUnit: "LTR", price: 620 },
  { code: "RM-003", name: "Chicken Breast", type: "Raw" as const, category: "Meat", primaryUnit: "KG", price: 280 },
  { code: "RM-004", name: "Onion (Red)", type: "Raw" as const, category: "Vegetables", primaryUnit: "KG", price: 35 },
  { code: "RM-005", name: "Tomato Paste", type: "Processed" as const, category: "Sauces", primaryUnit: "KG", price: 150 },
  { code: "RM-006", name: "Cumin Powder", type: "Processed" as const, category: "Spices", primaryUnit: "KG", price: 450 },
  { code: "RM-007", name: "Mozzarella Cheese", type: "Processed" as const, category: "Dairy", primaryUnit: "KG", price: 520 },
  { code: "RM-008", name: "All-Purpose Flour", type: "Raw" as const, category: "Grains", primaryUnit: "KG", price: 42 },
  { code: "RM-009", name: "Garlic", type: "Raw" as const, category: "Vegetables", primaryUnit: "KG", price: 120 },
  { code: "RM-010", name: "Ginger", type: "Raw" as const, category: "Vegetables", primaryUnit: "KG", price: 100 },
];

const MOCK_SAVED_RECIPES = [
  { id: "mi1", name: "Chicken Biryani (Regular)", category: "Biryanis", subCategory: "Non-Veg", recipeCost: 145.50, materials: [
    { code: "RM-001", name: "Basmati Rice", type: "Raw" as const, category: "Grains", qty: 0.3, unit: "KG", price: 85 },
    { code: "RM-003", name: "Chicken Breast", type: "Raw" as const, category: "Meat", qty: 0.25, unit: "KG", price: 280 },
    { code: "RM-004", name: "Onion (Red)", type: "Raw" as const, category: "Vegetables", qty: 0.1, unit: "KG", price: 35 },
  ]},
  { id: "mi2", name: "Paneer Butter Masala", category: "Main Course", subCategory: "Veg", recipeCost: 98.00, materials: [
    { code: "RM-005", name: "Tomato Paste", type: "Processed" as const, category: "Sauces", qty: 0.15, unit: "KG", price: 150 },
    { code: "RM-004", name: "Onion (Red)", type: "Raw" as const, category: "Vegetables", qty: 0.1, unit: "KG", price: 35 },
  ]},
  { id: "mi3", name: "Margherita Pizza (Medium)", category: "Pizzas", subCategory: "Veg", recipeCost: 120.75, materials: [
    { code: "RM-007", name: "Mozzarella Cheese", type: "Processed" as const, category: "Dairy", qty: 0.15, unit: "KG", price: 520 },
    { code: "RM-008", name: "All-Purpose Flour", type: "Raw" as const, category: "Grains", qty: 0.2, unit: "KG", price: 42 },
    { code: "RM-005", name: "Tomato Paste", type: "Processed" as const, category: "Sauces", qty: 0.1, unit: "KG", price: 150 },
  ]},
];

interface RecipeMaterialRow {
  code: string;
  name: string;
  type: "Raw" | "Processed";
  category: string;
  qty: number;
  unit: string;
  price: number;
}

interface ComboRecipeEntry {
  id: string;
  name: string;
  category: string;
  subCategory: string;
  qty: number;
}

export default function RecipeManagement({ editRecipeId, scrollToEdit }: { editRecipeId?: string; scrollToEdit?: boolean }) {
  const editRef = useRef<HTMLDivElement>(null);
  const [outlet, setOutlet] = useState("all");

  // Add recipe state
  const [addMode, setAddMode] = useState<"manual" | "import">("manual");
  const [isCombo, setIsCombo] = useState(false);
  const [addMaterials, setAddMaterials] = useState<RecipeMaterialRow[]>([]);
  const [addSearch, setAddSearch] = useState("");
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelected, setModalSelected] = useState<Set<string>>(new Set());
  const [modalViewMode, setModalViewMode] = useState<"all" | "selected">("all");

  // Combo state
  const [comboRecipes, setComboRecipes] = useState<ComboRecipeEntry[]>([]);
  const [comboSearch, setComboSearch] = useState("");
  const [comboSearchFocused, setComboSearchFocused] = useState(false);

  // Edit recipe state
  const [editSearch, setEditSearch] = useState("");
  const [editRecipe, setEditRecipe] = useState<string | null>(editRecipeId ?? null);
  const [editMaterials, setEditMaterials] = useState<RecipeMaterialRow[]>([]);

  useEffect(() => {
    if (editRecipe) {
      const recipe = MOCK_SAVED_RECIPES.find((r) => r.id === editRecipe);
      if (recipe) {
        setEditMaterials(recipe.materials.map((m) => ({ ...m })));
      }
    }
  }, [editRecipe]);

  useEffect(() => {
    if ((scrollToEdit || editRecipeId) && editRef.current) {
      setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }
  }, [scrollToEdit, editRecipeId]);

  // Material modal categories
  const categories = useMemo(() => {
    const cats: Record<string, typeof MOCK_MATERIALS_DB> = {};
    MOCK_MATERIALS_DB.forEach((m) => { (cats[m.category] ??= []).push(m); });
    return cats;
  }, []);

  const filteredModalCategories = useMemo(() => {
    let cats = { ...categories };
    if (modalSearch) {
      const q = modalSearch.toLowerCase();
      const filtered: Record<string, typeof MOCK_MATERIALS_DB> = {};
      Object.entries(cats).forEach(([cat, mats]) => {
        if (cat.toLowerCase().includes(q)) { filtered[cat] = mats; return; }
        const fm = mats.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
        if (fm.length) filtered[cat] = fm;
      });
      cats = filtered;
    }
    if (modalViewMode === "selected") {
      const filtered: Record<string, typeof MOCK_MATERIALS_DB> = {};
      Object.entries(cats).forEach(([cat, mats]) => {
        const fm = mats.filter((m) => modalSelected.has(m.code));
        if (fm.length) filtered[cat] = fm;
      });
      cats = filtered;
    }
    return cats;
  }, [categories, modalSearch, modalViewMode, modalSelected]);

  const openMaterialModal = (target: "add" | "edit") => {
    const existing = target === "add" ? addMaterials : editMaterials;
    setModalSelected(new Set(existing.map((m) => m.code)));
    setModalSearch("");
    setModalViewMode("all");
    setMaterialModalOpen(true);
  };

  const toggleMaterial = (code: string) => {
    const next = new Set(modalSelected);
    if (next.has(code)) next.delete(code); else next.add(code);
    setModalSelected(next);
  };

  const toggleCategory = (cat: string) => {
    const mats = categories[cat] || [];
    const next = new Set(modalSelected);
    const allSel = mats.every((m) => next.has(m.code));
    mats.forEach((m) => { if (allSel) next.delete(m.code); else next.add(m.code); });
    setModalSelected(next);
  };

  const [materialModalTarget, setMaterialModalTarget] = useState<"add" | "edit">("add");

  const confirmMaterialModal = () => {
    const setFn = materialModalTarget === "add" ? setAddMaterials : setEditMaterials;
    const existing = materialModalTarget === "add" ? addMaterials : editMaterials;
    const newMats: RecipeMaterialRow[] = [];
    modalSelected.forEach((code) => {
      const ex = existing.find((m) => m.code === code);
      if (ex) { newMats.push(ex); return; }
      const mat = MOCK_MATERIALS_DB.find((m) => m.code === code);
      if (mat) newMats.push({ code: mat.code, name: mat.name, type: mat.type, category: mat.category, qty: 0, unit: mat.primaryUnit, price: mat.price });
    });
    setFn(newMats);
    setMaterialModalOpen(false);
  };

  // Combo recipe search
  const filteredComboRecipes = useMemo(() => {
    if (!comboSearch.trim()) return [];
    const q = comboSearch.toLowerCase();
    return MOCK_SAVED_RECIPES.filter(
      (r) => r.name.toLowerCase().includes(q) && !comboRecipes.some((c) => c.id === r.id)
    );
  }, [comboSearch, comboRecipes]);

  const addComboRecipe = (recipe: typeof MOCK_SAVED_RECIPES[0]) => {
    setComboRecipes((prev) => [...prev, { id: recipe.id, name: recipe.name, category: recipe.category, subCategory: recipe.subCategory, qty: 1 }]);
    setComboSearch("");
  };

  // Derive combo materials from combo recipes
  const comboMaterials = useMemo(() => {
    const materialMap: Record<string, RecipeMaterialRow> = {};
    comboRecipes.forEach((cr) => {
      const recipe = MOCK_SAVED_RECIPES.find((r) => r.id === cr.id);
      if (!recipe) return;
      recipe.materials.forEach((m) => {
        if (materialMap[m.code]) {
          materialMap[m.code].qty += m.qty * cr.qty;
        } else {
          materialMap[m.code] = { ...m, qty: m.qty * cr.qty };
        }
      });
    });
    return Object.values(materialMap);
  }, [comboRecipes]);

  // Filtered add materials table
  const filteredAddMaterials = useMemo(() => {
    if (!addSearch.trim()) return addMaterials;
    const q = addSearch.toLowerCase();
    return addMaterials.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [addMaterials, addSearch]);

  const filteredEditMaterials = useMemo(() => {
    return editMaterials;
  }, [editMaterials]);

  const filteredEditRecipes = useMemo(() => {
    if (!editSearch.trim()) return MOCK_SAVED_RECIPES;
    const q = editSearch.toLowerCase();
    return MOCK_SAVED_RECIPES.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
  }, [editSearch]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="cento-page-title">Recipe Management</h2>
        <Select value={outlet} onValueChange={setOutlet}>
          <SelectTrigger className="w-[200px] h-9 text-xs bg-card">
            <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MOCK_OUTLETS.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ADD RECIPE */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Add Recipe</h3>
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
                <p>• Paste recipe data in sample sheet with specified format.</p>
                <p>• Upload the edited sheet for creation of recipes.</p>
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
            {/* Is a combo toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border max-w-xs">
              <Label className="text-xs font-medium">Is a Combo</Label>
              <Switch checked={isCombo} onCheckedChange={setIsCombo} />
            </div>

            {!isCombo ? (
              /* Standard recipe add */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search materials in table..." value={addSearch} onChange={(e) => setAddSearch(e.target.value)} className="pl-8 h-9 text-xs" />
                  </div>
                  <Button variant="cento" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => { setMaterialModalTarget("add"); openMaterialModal("add"); }}>
                    <Plus className="h-3.5 w-3.5" /> Add Material
                  </Button>
                </div>
                {addMaterials.length > 0 ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Recipe Unit</TableHead>
                          <TableHead className="text-right">Price (INR)</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAddMaterials.map((m) => (
                          <TableRow key={m.code}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                            <TableCell className="text-sm font-medium">{m.name}</TableCell>
                            <TableCell><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", m.type === "Raw" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>{m.type}</span></TableCell>
                            <TableCell className="text-sm">{m.category}</TableCell>
                            <TableCell><Input type="number" min={0} step={0.01} value={m.qty || ""} onChange={(e) => setAddMaterials((prev) => prev.map((p) => p.code === m.code ? { ...p, qty: parseFloat(e.target.value) || 0 } : p))} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                            <TableCell className="text-sm">{m.unit}</TableCell>
                            <TableCell className="text-right tabular-nums text-sm">₹{m.price.toFixed(2)}</TableCell>
                            <TableCell><button onClick={() => setAddMaterials((prev) => prev.filter((p) => p.code !== m.code))} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-border rounded-lg">No materials added yet. Click "Add Material" to get started.</div>
                )}
              </div>
            ) : (
              /* Combo recipe add */
              <div className="space-y-5">
                {/* Combo recipes search & table */}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Search & Add Recipes</Label>
                  <div className="relative w-80">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={comboSearch}
                      onChange={(e) => setComboSearch(e.target.value)}
                      onFocus={() => setComboSearchFocused(true)}
                      onBlur={() => setTimeout(() => setComboSearchFocused(false), 200)}
                      placeholder="Search existing recipes..."
                      className="pl-8 h-9 text-xs"
                    />
                    {comboSearchFocused && filteredComboRecipes.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[200px] overflow-auto">
                        {filteredComboRecipes.map((r) => (
                          <button key={r.id} onMouseDown={() => addComboRecipe(r)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left">
                            <Plus className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{r.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{r.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {comboRecipes.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead>Product Variant Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Sub Category</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comboRecipes.map((cr) => (
                          <TableRow key={cr.id}>
                            <TableCell className="font-medium text-sm">{cr.name}</TableCell>
                            <TableCell className="text-sm">{cr.category}</TableCell>
                            <TableCell className="text-sm">{cr.subCategory}</TableCell>
                            <TableCell>
                              <Input type="number" min={1} value={cr.qty} onChange={(e) => setComboRecipes((prev) => prev.map((p) => p.id === cr.id ? { ...p, qty: parseInt(e.target.value) || 1 } : p))} className="w-20 h-8 text-sm text-right bg-background" />
                            </TableCell>
                            <TableCell><button onClick={() => setComboRecipes((prev) => prev.filter((p) => p.id !== cr.id))} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Derived materials table */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Associated Materials</h4>
                  {comboMaterials.length > 0 ? (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead>Recipe Unit</TableHead>
                            <TableHead className="text-right">Price (INR)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {comboMaterials.map((m) => (
                            <TableRow key={m.code}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                              <TableCell className="text-sm font-medium">{m.name}</TableCell>
                              <TableCell><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", m.type === "Raw" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>{m.type}</span></TableCell>
                              <TableCell className="text-sm">{m.category}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">{m.qty.toFixed(2)}</TableCell>
                              <TableCell className="text-sm">{m.unit}</TableCell>
                              <TableCell className="text-right tabular-nums text-sm">₹{m.price.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground border border-border rounded-lg">
                      {comboRecipes.length === 0 ? "Add recipes above to see associated materials." : "No materials found for selected recipes."}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setAddMaterials([]); setComboRecipes([]); setIsCombo(false); }}>Cancel</Button>
              <Button variant="cento" size="sm" onClick={() => { toast({ title: "Recipe Added", description: "Recipe has been added successfully." }); setAddMaterials([]); setComboRecipes([]); setIsCombo(false); }}>Add Recipe</Button>
            </div>
          </div>
        )}
      </div>

      {/* EDIT RECIPE */}
      <div ref={editRef} className="cento-card">
        <h3 className="cento-section-header mb-5">Edit Recipe</h3>
        {!editRecipe ? (
          <div className="space-y-3">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search recipe to edit..." value={editSearch} onChange={(e) => setEditSearch(e.target.value)} className="pl-8 h-9 text-xs" />
            </div>
            {editSearch && (
              <div className="border border-border rounded-lg max-h-[200px] overflow-auto">
                {filteredEditRecipes.map((r) => (
                  <button key={r.id} onClick={() => setEditRecipe(r.id)} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0">
                    <span className="font-mono text-xs text-muted-foreground">{r.id}</span>
                    <span className="text-sm font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">₹{r.recipeCost.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Search and select a recipe to edit its details.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Editing: <span className="text-primary">{MOCK_SAVED_RECIPES.find((r) => r.id === editRecipe)?.name ?? editRecipe}</span></p>
              <button onClick={() => { setEditRecipe(null); setEditSearch(""); setEditMaterials([]); }} className="text-xs text-muted-foreground hover:text-foreground">✕ Close</button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search materials..." className="pl-8 h-9 text-xs" readOnly />
              </div>
              <Button variant="cento" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => { setMaterialModalTarget("edit"); openMaterialModal("edit"); }}>
                <Plus className="h-3.5 w-3.5" /> Add Material
              </Button>
            </div>

            {editMaterials.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Recipe Unit</TableHead>
                      <TableHead className="text-right">Price (INR)</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEditMaterials.map((m) => (
                      <TableRow key={m.code}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                        <TableCell className="text-sm font-medium">{m.name}</TableCell>
                        <TableCell><span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", m.type === "Raw" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700")}>{m.type}</span></TableCell>
                        <TableCell className="text-sm">{m.category}</TableCell>
                        <TableCell><Input type="number" min={0} step={0.01} value={m.qty || ""} onChange={(e) => setEditMaterials((prev) => prev.map((p) => p.code === m.code ? { ...p, qty: parseFloat(e.target.value) || 0 } : p))} className="w-20 h-8 text-sm text-right bg-background" /></TableCell>
                        <TableCell className="text-sm">{m.unit}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">₹{m.price.toFixed(2)}</TableCell>
                        <TableCell><button onClick={() => setEditMaterials((prev) => prev.filter((p) => p.code !== m.code))} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive/70" /></button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground border border-border rounded-lg">No materials in this recipe.</div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setEditRecipe(null); setEditSearch(""); setEditMaterials([]); }}>Cancel</Button>
              <Button variant="cento" size="sm" onClick={() => { toast({ title: "Recipe Updated", description: "Recipe has been updated." }); setEditRecipe(null); setEditSearch(""); setEditMaterials([]); }}>Update</Button>
            </div>
          </div>
        )}
      </div>

      {/* Material Selection Modal */}
      <Dialog open={materialModalOpen} onOpenChange={setMaterialModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Add Materials</DialogTitle></DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search categories or materials..." value={modalSearch} onChange={(e) => setModalSearch(e.target.value)} className="pl-8 h-9 text-xs" />
              </div>
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
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMaterialModalOpen(false)}>Cancel</Button>
            <Button variant="cento" size="sm" onClick={confirmMaterialModal}>Add Selected ({modalSelected.size})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
