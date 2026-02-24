import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pencil, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const MOCK_MATERIALS = [
  { code: "RM-001", name: "Basmati Rice", type: "Raw" as const, category: "Grains", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-20" },
  { code: "RM-002", name: "Olive Oil (Extra Virgin)", type: "Raw" as const, category: "Oils", primaryUnit: "LTR", secondaryUnit: "ML", lastUpdated: "2026-02-18" },
  { code: "RM-003", name: "Chicken Breast", type: "Raw" as const, category: "Meat", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-15" },
  { code: "RM-004", name: "Onion (Red)", type: "Raw" as const, category: "Vegetables", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-22" },
  { code: "RM-005", name: "Tomato Paste", type: "Processed" as const, category: "Sauces", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-19" },
  { code: "RM-006", name: "Cumin Powder", type: "Processed" as const, category: "Spices", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-10" },
  { code: "RM-007", name: "Mozzarella Cheese", type: "Processed" as const, category: "Dairy", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-17" },
  { code: "RM-008", name: "All-Purpose Flour", type: "Raw" as const, category: "Grains", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-21" },
  { code: "RM-009", name: "Garlic", type: "Raw" as const, category: "Vegetables", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-14" },
  { code: "RM-010", name: "Ginger", type: "Raw" as const, category: "Vegetables", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-16" },
  { code: "RM-011", name: "Salmon Fillet", type: "Raw" as const, category: "Seafood", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-12" },
  { code: "RM-012", name: "Cinnamon Sticks", type: "Raw" as const, category: "Spices", primaryUnit: "KG", secondaryUnit: "GM", lastUpdated: "2026-02-08" },
];

const CATEGORIES = ["All", "Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood"];
const TYPES = ["All", "Raw", "Processed"];

export default function Materials() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = useMemo(() => {
    return MOCK_MATERIALS.filter((m) => {
      if (categoryFilter !== "All" && m.category !== categoryFilter) return false;
      if (typeFilter !== "All" && m.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, categoryFilter, typeFilter]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search materials..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="cento" onClick={() => navigate("/settings", { state: { section: "/settings/material-management", scrollToEdit: true } })}>
          <Plus className="h-4 w-4" /> Add/Edit Material
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-card"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-9 text-xs bg-card"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-2">All Materials</h3>
      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Code</TableHead>
              <TableHead>Material Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Primary Unit</TableHead>
              <TableHead>Secondary Unit</TableHead>
              <TableHead>Last Updated At</TableHead>
              <TableHead className="w-[60px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No materials found.</TableCell></TableRow>
            ) : filtered.map((m) => (
              <TableRow key={m.code}>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                <TableCell className="font-medium text-primary">{m.name}</TableCell>
                <TableCell>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.type === "Raw" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{m.type}</span>
                </TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.primaryUnit}</TableCell>
                <TableCell className="text-muted-foreground">{m.secondaryUnit}</TableCell>
                <TableCell className="text-muted-foreground">{m.lastUpdated}</TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate("/settings", { state: { section: "/settings/material-management", editMaterial: m.code } })}
                    className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
