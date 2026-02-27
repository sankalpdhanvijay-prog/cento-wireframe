import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const MOCK_MATERIALS = [
  { id: "m1", code: "RM-001", name: "Basmati Rice", category: "Grains", primaryUnit: "KG" },
  { id: "m2", code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", primaryUnit: "LTR" },
  { id: "m3", code: "RM-003", name: "Chicken Breast", category: "Meat", primaryUnit: "KG" },
  { id: "m4", code: "RM-004", name: "Onion (Red)", category: "Vegetables", primaryUnit: "KG" },
  { id: "m5", code: "RM-005", name: "Tomato Paste", category: "Sauces", primaryUnit: "KG" },
  { id: "m6", code: "RM-006", name: "Cumin Powder", category: "Spices", primaryUnit: "KG" },
  { id: "m7", code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", primaryUnit: "KG" },
  { id: "m8", code: "RM-008", name: "All-Purpose Flour", category: "Grains", primaryUnit: "KG" },
];

const WASTAGE_CATEGORIES = ["Expired", "Spoiled", "Damaged", "Overscooping", "Burnt", "Other"];

interface WastageLineItem {
  id: string; code: string; name: string; category: string; wastageQty: number; wastageCategory: string; batch: string;
}

function MaterialSelectionModal({ open, onClose, existingIds, onAdd }: { open: boolean; onClose: () => void; existingIds: string[]; onAdd: (ids: string[]) => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(existingIds));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "selected">("all");

  useEffect(() => {
    if (open) { setSelectedIds(new Set(existingIds)); setSearchQuery(""); setViewMode("all"); }
  }, [open, existingIds]);

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
      const filtered = mats.filter((m) => {
        if (viewMode === "selected" && !selectedIds.has(m.id)) return false;
        if (!q) return true;
        return catMatch || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
      });
      if (filtered.length > 0) result[cat] = filtered;
    });
    return result;
  }, [categories, searchQuery, viewMode, selectedIds]);

  const toggle = (id: string) => setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleCat = (cat: string) => {
    const mats = categories[cat] || [];
    const all = mats.every((m) => selectedIds.has(m.id));
    setSelectedIds((p) => { const n = new Set(p); mats.forEach((m) => all ? n.delete(m.id) : n.add(m.id)); return n; });
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
            <button onClick={() => setViewMode("all")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>All</button>
            <button onClick={() => setViewMode("selected")} className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors", viewMode === "selected" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground")}>Selected ({selectedIds.size})</button>
          </div>
        </div>
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden border border-border rounded-lg">
          <div className="w-[200px] border-r border-border overflow-y-auto py-2 shrink-0">
            {Object.entries(filteredCategories).map(([cat, mats]) => {
              const allSel = (categories[cat] || []).every((m) => selectedIds.has(m.id));
              const someSel = (categories[cat] || []).some((m) => selectedIds.has(m.id));
              return (
                <button key={cat} onClick={() => toggleCat(cat)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left">
                  <Checkbox checked={allSel ? true : someSel ? "indeterminate" : false} onCheckedChange={() => toggleCat(cat)} className="h-3.5 w-3.5" />
                  <span className={cn("font-medium text-xs", allSel && "text-primary")}>{cat}</span>
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
                  <button key={m.id} onClick={() => toggle(m.id)} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors text-left", selectedIds.has(m.id) && "bg-cento-yellow-tint")}>
                    <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggle(m.id)} className="h-3.5 w-3.5" />
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
          <Button variant="cento" onClick={() => { onAdd(Array.from(selectedIds)); onClose(); }}>Add {selectedIds.size} Material{selectedIds.size !== 1 ? "s" : ""}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function NewWastage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WastageLineItem[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "draft" | "template" | "log" | "cancel">(null);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i) => i.code.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q));
  }, [items, search]);

  const addMaterials = (ids: string[]) => {
    const existing = new Set(items.map((i) => i.id));
    const newItems = ids.filter((id) => !existing.has(id)).map((id) => {
      const m = MOCK_MATERIALS.find((x) => x.id === id)!;
      return { id: m.id, code: m.code, name: m.name, category: m.category, wastageQty: 0, wastageCategory: "", batch: "" };
    });
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id: string, updates: Partial<WastageLineItem>) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));

  const handleConfirm = () => {
    if (confirmAction === "draft") {
      toast({ title: "Wastage Saved", description: "Wastage saved as draft." });
      navigate("/wastage", { state: { selectTab: "Draft" } });
    } else if (confirmAction === "template") {
      toast({ title: "Template Saved", description: "Wastage saved as template." });
      navigate("/wastage", { state: { selectTab: "templates" } });
    } else if (confirmAction === "log") {
      toast({ title: "Wastage Logged", description: "Wastage has been logged." });
      navigate("/wastage", { state: { selectTab: "InReview" } });
    } else if (confirmAction === "cancel") {
      navigate("/wastage");
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div>
        <h1 className="cento-page-title text-xl">New Wastage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Log wastage for inventory materials</p>
      </div>

      <div className="cento-card p-4 space-y-4">
        <h2 className="cento-section-header text-sm font-semibold">Material Details</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search materials..." className="pl-8 h-9 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="cento" size="sm" onClick={() => setModalOpen(true)}><Plus className="h-3.5 w-3.5 mr-1" />Add Material</Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Wastage Qty</TableHead>
                <TableHead>Wastage Category</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No materials added. Click "Add Material" to begin.</TableCell></TableRow>
              ) : filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="text-right">
                    <Input type="number" className="h-8 w-20 text-xs text-right ml-auto" value={item.wastageQty || ""} onChange={(e) => updateItem(item.id, { wastageQty: Number(e.target.value) || 0 })} />
                  </TableCell>
                  <TableCell>
                    <Select value={item.wastageCategory} onValueChange={(v) => updateItem(item.id, { wastageCategory: v })}>
                      <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {WASTAGE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input className="h-8 w-24 text-xs" value={item.batch} onChange={(e) => updateItem(item.id, { batch: e.target.value })} placeholder="Batch" />
                  </TableCell>
                  <TableCell>
                    <button onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("draft")}>Save as Draft</Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("template")}>Save as Template</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("cancel")}>Cancel</Button>
            <Button variant="cento" size="sm" onClick={() => setConfirmAction("log")}>Log Wastage</Button>
          </div>
        </div>
      </div>

      <MaterialSelectionModal open={modalOpen} onClose={() => setModalOpen(false)} existingIds={items.map((i) => i.id)} onAdd={addMaterials} />

      {(["draft", "template", "log", "cancel"] as const).map((action) => (
        <ConfirmationModal
          key={action}
          open={confirmAction === action}
          onOpenChange={() => setConfirmAction(null)}
          title={`${action === "draft" ? "Save Draft" : action === "template" ? "Save Template" : action === "log" ? "Log Wastage" : "Cancel"} Confirmation`}
          description={`Clicking on Confirm will ${action === "draft" ? "save this wastage as a draft" : action === "template" ? "save this wastage as a template" : action === "log" ? "log this wastage" : "cancel and discard changes"}.`}
          onConfirm={handleConfirm}
          confirmLabel="Confirm"
          confirmVariant={action === "cancel" ? "destructive" : "default"}
        />
      ))}
    </div>
  );
}
