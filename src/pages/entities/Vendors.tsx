import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Pencil, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const MOCK_VENDORS = [
  { id: "VN1", name: "Fresh Farms Pvt Ltd", contact: "9876543210", materials: "Vegetables, Grains", category: "Vegetables", type: "Raw", lastUpdated: "2026-02-20" },
  { id: "VN2", name: "Spice World Trading", contact: "9123456789", materials: "Spices, Sauces", category: "Spices", type: "Processed", lastUpdated: "2026-02-18" },
  { id: "VN3", name: "Ocean Catch Seafood", contact: "9988776655", materials: "Seafood", category: "Seafood", type: "Raw", lastUpdated: "2026-02-15" },
  { id: "VN4", name: "DairyBest Co.", contact: "9001122334", materials: "Dairy", category: "Dairy", type: "Raw", lastUpdated: "2026-02-22" },
  { id: "VN5", name: "PackagePro Solutions", contact: "9556677889", materials: "Packaging", category: "Packaging", type: "Processed", lastUpdated: "2026-02-10" },
  { id: "VN6", name: "Golden Oils Ltd", contact: "9334455667", materials: "Oils", category: "Oils", type: "Raw", lastUpdated: "2026-02-12" },
];

const CATEGORIES = ["All", "Vegetables", "Grains", "Spices", "Sauces", "Seafood", "Dairy", "Packaging", "Oils", "Meat"];
const TYPES = ["All", "Raw", "Processed"];

export default function Vendors() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered = useMemo(() => {
    return MOCK_VENDORS.filter((v) => {
      if (categoryFilter !== "All" && v.category !== categoryFilter) return false;
      if (typeFilter !== "All" && v.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return v.id.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || v.materials.toLowerCase().includes(q) || v.contact.includes(q);
      }
      return true;
    });
  }, [search, categoryFilter, typeFilter]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search vendors..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="cento" onClick={() => navigate("/settings", { state: { section: "/settings/vendor-management", scrollToEdit: true } })}>
          <Plus className="h-4 w-4" /> Add/Edit Vendor
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

      <h3 className="text-sm font-semibold text-foreground mb-2">Vendors</h3>
      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Vendor ID</TableHead>
              <TableHead>Vendor Name</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[60px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No vendors found.</TableCell></TableRow>
            ) : filtered.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{v.id}</TableCell>
                <TableCell className="font-medium text-primary">{v.name}</TableCell>
                <TableCell>{v.contact}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{v.materials}</TableCell>
                <TableCell className="text-muted-foreground">{v.lastUpdated}</TableCell>
                <TableCell>
                  <button
                    onClick={() => navigate("/settings", { state: { section: "/settings/vendor-management", editVendor: v.id } })}
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
