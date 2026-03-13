import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

type TaxType = "Interstate" | "Intrastate" | "All";

interface TaxRow {
  id: string;
  name: string;
  value: number;
  type: TaxType;
  materialMappings: string[]; // material codes
}

const MOCK_MATERIALS = [
  { code: "RM-001", name: "Basmati Rice", type: "Raw", category: "Grains", primaryUnit: "KG", hsnCode: "1006" },
  { code: "RM-002", name: "Olive Oil (Extra Virgin)", type: "Raw", category: "Oils", primaryUnit: "LTR", hsnCode: "1509" },
  { code: "RM-003", name: "Chicken Breast", type: "Raw", category: "Meat", primaryUnit: "KG", hsnCode: "0207" },
  { code: "RM-005", name: "Tomato Paste", type: "Processed", category: "Sauces", primaryUnit: "KG", hsnCode: "2002" },
  { code: "RM-007", name: "Mozzarella Cheese", type: "Processed", category: "Dairy", primaryUnit: "KG", hsnCode: "0406" },
];

const INITIAL_TAXES: TaxRow[] = [
  { id: "TAX-001", name: "IGST 18%", value: 18, type: "Interstate", materialMappings: ["RM-001", "RM-002"] },
  { id: "TAX-002", name: "CGST 9%", value: 9, type: "Intrastate", materialMappings: ["RM-001", "RM-003"] },
  { id: "TAX-003", name: "SGST 9%", value: 9, type: "Intrastate", materialMappings: ["RM-001", "RM-003"] },
  { id: "TAX-004", name: "GST 5%", value: 5, type: "All", materialMappings: ["RM-005", "RM-007"] },
];

const TAX_TYPES: TaxType[] = ["Interstate", "Intrastate", "All"];

function MaterialMappingTable({ search, setSearch, mappings, onToggle }: {
  search: string; setSearch: (s: string) => void;
  mappings: Set<string>; onToggle: (code: string) => void;
}) {
  const filtered = useMemo(() => {
    if (!search) return MOCK_MATERIALS;
    const q = search.toLowerCase();
    return MOCK_MATERIALS.filter((m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Material Mapping</h4>
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
      </div>
      <div className="border border-border rounded-lg overflow-hidden max-h-[240px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs">Code</TableHead>
              <TableHead className="text-xs">Material Name</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Primary Unit</TableHead>
              <TableHead className="text-xs">HSN Code</TableHead>
              <TableHead className="text-xs w-20">Apply Tax</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.code}>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                <TableCell className="text-sm">{m.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.type}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.category}</TableCell>
                <TableCell className="text-xs">{m.primaryUnit}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.hsnCode}</TableCell>
                <TableCell><Switch checked={mappings.has(m.code)} onCheckedChange={() => onToggle(m.code)} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function TaxManagement() {
  const [taxes, setTaxes] = useState<TaxRow[]>(INITIAL_TAXES);
  const [search, setSearch] = useState("");

  // Edit modal
  const [editTax, setEditTax] = useState<TaxRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<TaxType>("All");
  const [editMappings, setEditMappings] = useState<Set<string>>(new Set());
  const [editMatSearch, setEditMatSearch] = useState("");

  // Add form
  const [addName, setAddName] = useState("");
  const [addValue, setAddValue] = useState("");
  const [addType, setAddType] = useState<TaxType>("All");
  const [addMappings, setAddMappings] = useState<Set<string>>(new Set());
  const [addMatSearch, setAddMatSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return taxes;
    const q = search.toLowerCase();
    return taxes.filter((t) => t.name.toLowerCase().includes(q));
  }, [taxes, search]);

  const openEdit = (tax: TaxRow) => {
    setEditTax(tax); setEditName(tax.name); setEditValue(String(tax.value));
    setEditType(tax.type); setEditMappings(new Set(tax.materialMappings)); setEditMatSearch("");
  };

  const saveEdit = () => {
    if (!editTax) return;
    setTaxes(taxes.map((t) => t.id === editTax.id ? { ...t, name: editName, value: parseFloat(editValue) || 0, type: editType, materialMappings: Array.from(editMappings) } : t));
    toast({ title: "Tax Updated", description: `${editName} has been updated.` });
    setEditTax(null);
  };

  const toggleEditMapping = (code: string) => {
    const next = new Set(editMappings);
    if (next.has(code)) next.delete(code); else next.add(code);
    setEditMappings(next);
  };

  const toggleAddMapping = (code: string) => {
    const next = new Set(addMappings);
    if (next.has(code)) next.delete(code); else next.add(code);
    setAddMappings(next);
  };

  const addTax = () => {
    const newTax: TaxRow = {
      id: `TAX-${String(taxes.length + 1).padStart(3, "0")}`,
      name: addName, value: parseFloat(addValue) || 0, type: addType,
      materialMappings: Array.from(addMappings),
    };
    setTaxes([...taxes, newTax]);
    toast({ title: "Tax Added", description: `${addName} has been created.` });
    setAddName(""); setAddValue(""); setAddType("All"); setAddMappings(new Set()); setAddMatSearch("");
  };

  const canAdd = addName.trim() && addValue.trim();

  return (
    <div className="space-y-8">
      <h2 className="cento-page-title">Tax Management</h2>

      {/* Section 1: Taxes List */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-4">Taxes List</h3>
        <div className="relative w-64 mb-4">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by tax name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs">Tax ID</TableHead>
                <TableHead className="text-xs">Tax Name</TableHead>
                <TableHead className="text-xs text-right">Tax Value (%)</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No taxes found.</TableCell></TableRow>
              ) : filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                  <TableCell className="text-sm font-medium">{t.name}</TableCell>
                  <TableCell className="text-sm text-right tabular-nums">{t.value}%</TableCell>
                  <TableCell>
                    <span className={cn("text-xs px-2 py-0.5 rounded border",
                      t.type === "Interstate" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      t.type === "Intrastate" ? "bg-purple-50 text-purple-700 border-purple-200" :
                      "bg-muted text-muted-foreground border-border"
                    )}>{t.type}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded hover:bg-muted/60 transition-colors">
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 2: Add Taxes */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-4">Add Tax</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Tax Name</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} className="mt-1 h-9 text-sm" placeholder="e.g. IGST 12%" />
            </div>
            <div>
              <Label className="text-xs">Tax Value (%)</Label>
              <Input type="number" min={0} value={addValue} onChange={(e) => setAddValue(e.target.value)} className="mt-1 h-9 text-sm" placeholder="0" />
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <div className="flex gap-1.5 mt-1">
                {TAX_TYPES.map((t) => (
                  <button key={t} onClick={() => setAddType(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg border transition-all", addType === t ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <MaterialMappingTable search={addMatSearch} setSearch={setAddMatSearch} mappings={addMappings} onToggle={toggleAddMapping} />
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => { setAddName(""); setAddValue(""); setAddType("All"); setAddMappings(new Set()); }}>Cancel</Button>
            <Button variant="cento" size="sm" disabled={!canAdd} onClick={addTax}>Add Tax</Button>
          </div>
        </div>
      </div>

      {/* Edit Tax Modal */}
      <Dialog open={!!editTax} onOpenChange={() => setEditTax(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Update Tax</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Tax Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Tax Value (%)</Label>
                <Input type="number" min={0} value={editValue} onChange={(e) => setEditValue(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <div className="flex gap-1.5 mt-1">
                  {TAX_TYPES.map((t) => (
                    <button key={t} onClick={() => setEditType(t)} className={cn("px-3 py-2 text-xs font-medium rounded-lg border transition-all", editType === t ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <MaterialMappingTable search={editMatSearch} setSearch={setEditMatSearch} mappings={editMappings} onToggle={toggleEditMapping} />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditTax(null)}>Cancel</Button>
            <Button variant="cento" size="sm" onClick={saveEdit}>Update Tax</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
