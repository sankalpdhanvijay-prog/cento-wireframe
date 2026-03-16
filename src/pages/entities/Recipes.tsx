import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pencil, Plus, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const MOCK_MATERIALS_DB = [
  { code: "RM-001", name: "Basmati Rice", type: "Raw", category: "Grains" },
  { code: "RM-002", name: "Olive Oil (Extra Virgin)", type: "Raw", category: "Oils" },
  { code: "RM-003", name: "Chicken Breast", type: "Raw", category: "Meat" },
  { code: "RM-004", name: "Onion (Red)", type: "Raw", category: "Vegetables" },
  { code: "RM-005", name: "Tomato Paste", type: "Processed", category: "Sauces" },
  { code: "RM-006", name: "Cumin Powder", type: "Processed", category: "Spices" },
  { code: "RM-007", name: "Mozzarella Cheese", type: "Processed", category: "Dairy" },
  { code: "RM-008", name: "All-Purpose Flour", type: "Raw", category: "Grains" },
  { code: "RM-009", name: "Garlic", type: "Raw", category: "Vegetables" },
  { code: "RM-010", name: "Ginger", type: "Raw", category: "Vegetables" },
];

const MOCK_MENU_ITEMS = [
  { id: "mi1", name: "Chicken Biryani (Regular)", category: "Biryanis", subCategory: "Non-Veg", recipeCost: 145.50 },
  { id: "mi2", name: "Paneer Butter Masala", category: "Main Course", subCategory: "Veg", recipeCost: 98.00 },
  { id: "mi3", name: "Margherita Pizza (Medium)", category: "Pizzas", subCategory: "Veg", recipeCost: 120.75 },
  { id: "mi4", name: "Chicken Caesar Salad", category: "Salads", subCategory: "Non-Veg", recipeCost: 85.00 },
  { id: "mi5", name: "Masala Dosa", category: "South Indian", subCategory: "Veg", recipeCost: 55.25 },
  { id: "mi6", name: "Grilled Fish Platter", category: "Seafood", subCategory: "Non-Veg", recipeCost: 220.00 },
];

const MOCK_ADDONS = [
  { id: "ao1", name: "Extra Cheese", template: "Pizza Extras", recipeCost: 35.00 },
  { id: "ao2", name: "Garlic Bread (2pc)", template: "Sides", recipeCost: 28.50 },
  { id: "ao3", name: "Raita", template: "Accompaniments", recipeCost: 15.00 },
  { id: "ao4", name: "Grilled Chicken Strip", template: "Protein Add-ons", recipeCost: 65.00 },
  { id: "ao5", name: "Mint Chutney", template: "Condiments", recipeCost: 8.00 },
];

const MOCK_PROCESSED = [
  { id: "pm1", name: "Pizza Dough Base", category: "Bakery", subCategory: "Bases", recipeCost: 22.00 },
  { id: "pm2", name: "Biryani Masala Paste", category: "Spice Blends", subCategory: "Paste", recipeCost: 45.00 },
  { id: "pm3", name: "Tomato Concassé", category: "Prep Items", subCategory: "Sauces", recipeCost: 18.50 },
  { id: "pm4", name: "Tandoori Marinade", category: "Marinades", subCategory: "Non-Veg", recipeCost: 32.00 },
];

export default function Recipes() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("menu");
  const [search, setSearch] = useState("");

  // Material filter modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterModalSearch, setFilterModalSearch] = useState("");
  const [filterModalSelected, setFilterModalSelected] = useState<Set<string>>(new Set());
  const [filterModalViewMode, setFilterModalViewMode] = useState<"all" | "selected">("all");
  const [activeMaterialFilter, setActiveMaterialFilter] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const cats: Record<string, typeof MOCK_MATERIALS_DB> = {};
    MOCK_MATERIALS_DB.forEach((m) => { (cats[m.category] ??= []).push(m); });
    return cats;
  }, []);

  const filteredModalCategories = useMemo(() => {
    let cats = { ...categories };
    if (filterModalSearch) {
      const q = filterModalSearch.toLowerCase();
      const filtered: Record<string, typeof MOCK_MATERIALS_DB> = {};
      Object.entries(cats).forEach(([cat, mats]) => {
        if (cat.toLowerCase().includes(q)) { filtered[cat] = mats; return; }
        const fm = mats.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
        if (fm.length) filtered[cat] = fm;
      });
      cats = filtered;
    }
    if (filterModalViewMode === "selected") {
      const filtered: Record<string, typeof MOCK_MATERIALS_DB> = {};
      Object.entries(cats).forEach(([cat, mats]) => {
        const fm = mats.filter((m) => filterModalSelected.has(m.code));
        if (fm.length) filtered[cat] = fm;
      });
      cats = filtered;
    }
    return cats;
  }, [categories, filterModalSearch, filterModalViewMode, filterModalSelected]);

  const openFilterModal = () => {
    setFilterModalSelected(new Set(activeMaterialFilter));
    setFilterModalSearch("");
    setFilterModalViewMode("all");
    setFilterModalOpen(true);
  };

  const applyFilter = () => {
    setActiveMaterialFilter(new Set(filterModalSelected));
    setFilterModalOpen(false);
  };

  const clearFilter = () => {
    setActiveMaterialFilter(new Set());
  };

  const toggleMaterial = (code: string) => {
    const next = new Set(filterModalSelected);
    if (next.has(code)) next.delete(code); else next.add(code);
    setFilterModalSelected(next);
  };

  const toggleCategory = (cat: string) => {
    const mats = categories[cat] || [];
    const next = new Set(filterModalSelected);
    const allSelected = mats.every((m) => next.has(m.code));
    mats.forEach((m) => { if (allSelected) next.delete(m.code); else next.add(m.code); });
    setFilterModalSelected(next);
  };

  const filteredMenuItems = useMemo(() => {
    let items = MOCK_MENU_ITEMS;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [search]);

  const filteredAddons = useMemo(() => {
    let items = MOCK_ADDONS;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [search]);

  const filteredProcessed = useMemo(() => {
    let items = MOCK_PROCESSED;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [search]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search by name..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9" onClick={openFilterModal}>
            <Filter className="h-3.5 w-3.5" />
            Material
            {activeMaterialFilter.size > 0 && <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">{activeMaterialFilter.size}</span>}
          </Button>
          {activeMaterialFilter.size > 0 && (
            <button onClick={clearFilter} className="text-xs text-muted-foreground hover:text-foreground">Clear filter</button>
          )}
        </div>
        <Button variant="cento" onClick={() => navigate("/settings", { state: { section: "/settings/recipe-management", scrollToEdit: true } })}>
          <Plus className="h-4 w-4" /> Add/Edit Recipe
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setSearch(""); }}>
        <TabsList>
          <TabsTrigger value="menu">Menu Items</TabsTrigger>
          <TabsTrigger value="addons">Add-Ons</TabsTrigger>
          <TabsTrigger value="processed">Processed Materials</TabsTrigger>
        </TabsList>

        <TabsContent value="menu">
          <div className="cento-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Product Variant Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead className="text-right">Recipe Cost (INR)</TableHead>
                  <TableHead className="w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMenuItems.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No menu items found.</TableCell></TableRow>
                ) : filteredMenuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-muted-foreground">{item.subCategory}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">₹{item.recipeCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <button onClick={() => navigate("/settings", { state: { section: "/settings/recipe-management", editRecipe: item.id } })} className="p-1.5 rounded hover:bg-muted/60 transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="addons">
          <div className="cento-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Menu Add On Name</TableHead>
                  <TableHead>Add On Template</TableHead>
                  <TableHead className="text-right">Recipe Cost (INR)</TableHead>
                  <TableHead className="w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAddons.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No add-ons found.</TableCell></TableRow>
                ) : filteredAddons.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.template}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">₹{item.recipeCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <button onClick={() => navigate("/settings", { state: { section: "/settings/recipe-management", editRecipe: item.id } })} className="p-1.5 rounded hover:bg-muted/60 transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="processed">
          <div className="cento-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Product Variant Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead className="text-right">Recipe Cost (INR)</TableHead>
                  <TableHead className="w-[60px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcessed.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No processed materials found.</TableCell></TableRow>
                ) : filteredProcessed.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.category}</TableCell>
                    <TableCell className="text-muted-foreground">{item.subCategory}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">₹{item.recipeCost.toFixed(2)}</TableCell>
                    <TableCell>
                      <button onClick={() => navigate("/settings", { state: { section: "/settings/recipe-management", editRecipe: item.id } })} className="p-1.5 rounded hover:bg-muted/60 transition-colors">
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Material Filter Modal — same pattern as NewPurchase */}
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Filter by Material</DialogTitle></DialogHeader>
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search categories or materials..." value={filterModalSearch} onChange={(e) => setFilterModalSearch(e.target.value)} className="pl-8 h-9 text-xs" />
              </div>
              <div className="flex gap-1 bg-muted/40 rounded-lg p-0.5">
                <button onClick={() => setFilterModalViewMode("all")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", filterModalViewMode === "all" ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}>All</button>
                <button onClick={() => setFilterModalViewMode("selected")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", filterModalViewMode === "selected" ? "bg-background shadow-sm font-medium" : "text-muted-foreground")}>Selected</button>
              </div>
            </div>
            <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
              <div className="w-48 border-r border-border pr-3 overflow-y-auto shrink-0 space-y-1">
                {Object.entries(filteredModalCategories).map(([cat, mats]) => {
                  const allSel = mats.every((m) => filterModalSelected.has(m.code));
                  const someSel = mats.some((m) => filterModalSelected.has(m.code));
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
                {Object.entries(filteredModalCategories).map(([cat, mats]) => (
                  <div key={cat}>
                    <p className="text-xs font-semibold text-muted-foreground px-2 py-1">{cat}</p>
                    {mats.map((m) => (
                      <button key={m.code} onClick={() => toggleMaterial(m.code)} className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-all", filterModalSelected.has(m.code) ? "bg-cento-yellow-tint" : "hover:bg-muted/40")}>
                        <Checkbox checked={filterModalSelected.has(m.code)} className="h-3.5 w-3.5" />
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
            <Button variant="outline" size="sm" onClick={() => setFilterModalOpen(false)}>Cancel</Button>
            <Button variant="cento" size="sm" onClick={applyFilter}>Apply Filter ({filterModalSelected.size})</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
