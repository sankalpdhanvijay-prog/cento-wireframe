import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pencil } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MOCK_W_TEMPLATES = [
  { id: "wtmpl-1", name: "Weekly Kitchen Wastage", createdBy: "Admin", createdOn: "2025-12-01" },
  { id: "wtmpl-2", name: "End of Day Wastage Log", createdBy: "Manager", createdOn: "2025-11-20" },
];

interface WastageEntry {
  id: string; createdBy: string; createdOn: string; referenceId: string; wastageAmount: number;
  status: "Draft" | "InReview" | "Closed";
  materials: { code: string; name: string; category: string; wastageQty: number; wastageCategory: string; batch: string }[];
}

const MOCK_WASTAGES: WastageEntry[] = [
  {
    id: "WTG-001", createdBy: "Admin", createdOn: "2025-12-10", referenceId: "REF-101", wastageAmount: 1500, status: "Draft",
    materials: [{ code: "RM-001", name: "Basmati Rice", category: "Grains", wastageQty: 5, wastageCategory: "Expired", batch: "B-001" }],
  },
  {
    id: "WTG-002", createdBy: "Manager", createdOn: "2025-12-08", referenceId: "REF-102", wastageAmount: 800, status: "InReview",
    materials: [{ code: "RM-003", name: "Chicken Breast", category: "Meat", wastageQty: 2, wastageCategory: "Spoiled", batch: "B-020" }],
  },
  {
    id: "WTG-003", createdBy: "Admin", createdOn: "2025-12-01", referenceId: "REF-103", wastageAmount: 2200, status: "Closed",
    materials: [{ code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", wastageQty: 3, wastageCategory: "Expired", batch: "B-015" }],
  },
  {
    id: "WTG-004", createdBy: "Staff", createdOn: "2025-11-28", referenceId: "REF-104", wastageAmount: 350, status: "InReview",
    materials: [{ code: "RM-004", name: "Onion (Red)", category: "Vegetables", wastageQty: 10, wastageCategory: "Damaged", batch: "B-005" }],
  },
];

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Wastage() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<"templates" | "status">("status");
  const [statusTab, setStatusTab] = useState<"Draft" | "InReview" | "Closed">("Draft");
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return MOCK_W_TEMPLATES;
    const q = search.toLowerCase();
    return MOCK_W_TEMPLATES.filter((t) => t.name.toLowerCase().includes(q) || t.createdBy.toLowerCase().includes(q));
  }, [search]);

  const filteredWastages = useMemo(() => {
    const byStatus = MOCK_WASTAGES.filter((w) => w.status === statusTab);
    if (!search.trim()) return byStatus;
    const q = search.toLowerCase();
    return byStatus.filter((w) => w.id.toLowerCase().includes(q) || w.createdBy.toLowerCase().includes(q) || w.referenceId.toLowerCase().includes(q));
  }, [search, statusTab]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="cento-page-title text-xl">Wastages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Log the wastages in the Inventory and Update material's stock.</p>
        </div>
        <Button variant="cento" onClick={() => navigate("/wastage/new")}>New Wastage</Button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setMainTab("templates")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg border-2 transition-all", mainTab === "templates" ? "border-primary bg-cento-yellow-tint text-foreground shadow-sm" : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
          Templates
        </button>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
          {(["Draft", "InReview", "Closed"] as const).map((s) => (
            <button key={s} onClick={() => { setMainTab("status"); setStatusTab(s); }} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", mainTab === "status" && statusTab === s ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s === "InReview" ? "In Review" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {mainTab === "templates" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Template Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-12 text-muted-foreground">No templates found.</TableCell></TableRow>
              ) : filteredTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{t.createdOn}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {mainTab === "status" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Wastage ID</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Reference ID</TableHead>
                <TableHead className="text-right">Wastage Amount</TableHead>
                {statusTab === "InReview" && <TableHead>Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWastages.length === 0 ? (
                <TableRow><TableCell colSpan={statusTab === "InReview" ? 6 : 5} className="text-center py-12 text-muted-foreground">No wastages found.</TableCell></TableRow>
              ) : filteredWastages.map((w) => (
                <TableRow
                  key={w.id}
                  className="cento-row-clickable"
                  onClick={() => navigate(`/wastage/${w.id}`, { state: { wastage: w } })}
                >
                  <TableCell className="font-medium text-primary">{w.id}</TableCell>
                  <TableCell>{w.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{w.createdOn}</TableCell>
                  <TableCell className="text-muted-foreground">{w.referenceId}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(w.wastageAmount)}</TableCell>
                  {statusTab === "InReview" && (
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-200 text-amber-700 bg-amber-50">In Review</Badge>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
