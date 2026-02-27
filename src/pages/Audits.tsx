import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pencil } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// --- Mock Data ---
const MOCK_TEMPLATES = [
  { id: "tmpl-1", name: "Weekly Kitchen Audit", compliance: true, createdBy: "Admin", createdOn: "2025-12-01" },
  { id: "tmpl-2", name: "Monthly Inventory Count", compliance: false, createdBy: "Manager", createdOn: "2025-11-20" },
  { id: "tmpl-3", name: "Quarterly Compliance Audit", compliance: true, createdBy: "Admin", createdOn: "2025-10-15" },
];

interface AuditEntry {
  id: string;
  createdBy: string;
  createdOn: string;
  auditDate?: string;
  auditTime?: string;
  materialCount?: number;
  status: "Draft" | "InReview" | "Closed";
  materials: { code: string; name: string; category: string; systemStock: number; actualStock: number; variance: number; percentVariance: number; batchName: string; reason: string; costVariance?: number; countVariance?: number }[];
}

const MOCK_AUDITS: AuditEntry[] = [
  {
    id: "AUD-001", createdBy: "Admin", createdOn: "2025-12-10 10:30", auditDate: "2025-12-10", auditTime: "10:30",
    materialCount: 5, status: "Draft",
    materials: [
      { code: "RM-001", name: "Basmati Rice", category: "Grains", systemStock: 120, actualStock: 115, variance: -5, percentVariance: -4.17, batchName: "B-001", reason: "Overscooping" },
      { code: "RM-004", name: "Onion (Red)", category: "Vegetables", systemStock: 200, actualStock: 198, variance: -2, percentVariance: -1.0, batchName: "B-002", reason: "Spillage" },
    ],
  },
  {
    id: "AUD-002", createdBy: "Manager", createdOn: "2025-12-08 14:00", auditDate: "2025-12-08", auditTime: "14:00",
    materialCount: 3, status: "InReview",
    materials: [
      { code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", systemStock: 45, actualStock: 44, variance: -1, percentVariance: -2.22, batchName: "B-010", reason: "Measurement error" },
    ],
  },
  {
    id: "AUD-003", createdBy: "Admin", createdOn: "2025-12-01 09:00", auditDate: "2025-12-01", auditTime: "09:00",
    materialCount: 8, status: "Closed",
    materials: [
      { code: "RM-003", name: "Chicken Breast", category: "Meat", systemStock: 30, actualStock: 28, variance: -2, percentVariance: -6.67, batchName: "B-020", reason: "Overscooping", costVariance: -560, countVariance: -2 },
    ],
  },
  {
    id: "AUD-004", createdBy: "Staff", createdOn: "2025-11-28 16:00", status: "Draft",
    materials: [
      { code: "RM-006", name: "Cumin Powder", category: "Spices", systemStock: 15, actualStock: 14, variance: -1, percentVariance: -6.67, batchName: "B-030", reason: "Spillage" },
    ],
  },
];

export default function Audits() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState<"templates" | "status">("status");
  const [statusTab, setStatusTab] = useState<"Draft" | "InReview" | "Closed">("Draft");
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return MOCK_TEMPLATES;
    const q = search.toLowerCase();
    return MOCK_TEMPLATES.filter((t) => t.name.toLowerCase().includes(q) || t.createdBy.toLowerCase().includes(q));
  }, [search]);

  const filteredAudits = useMemo(() => {
    const byStatus = MOCK_AUDITS.filter((a) => a.status === statusTab);
    if (!search.trim()) return byStatus;
    const q = search.toLowerCase();
    return byStatus.filter((a) => a.id.toLowerCase().includes(q) || a.createdBy.toLowerCase().includes(q));
  }, [search, statusTab]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="cento-page-title text-xl">Audits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View and Add Audits and Update Inventory accordingly</p>
        </div>
        <Button variant="cento" onClick={() => navigate("/audits/new")}>New Audit</Button>
      </div>

      {/* Tabs */}
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

      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Templates Tab */}
      {mainTab === "templates" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Template Name</TableHead>
                <TableHead>Compliance</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No templates found.</TableCell></TableRow>
              ) : filteredTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", t.compliance ? "border-green-200 text-green-700 bg-green-50" : "border-red-200 text-red-600 bg-red-50")}>
                      {t.compliance ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{t.createdOn}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="cento" className="h-7 text-xs" onClick={() => navigate("/audits/new", { state: { templateId: t.id } })}>
                      Use
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Status Tabs */}
      {mainTab === "status" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {statusTab === "Draft" && (<>
                  <TableHead>Audit ID</TableHead><TableHead>Created By</TableHead><TableHead>Created On</TableHead><TableHead>Action</TableHead>
                </>)}
                {statusTab === "InReview" && (<>
                  <TableHead>Audit ID</TableHead><TableHead>Created At</TableHead><TableHead>Created By</TableHead><TableHead>Audit Date</TableHead><TableHead>Audit Time</TableHead><TableHead>Material Count</TableHead>
                </>)}
                {statusTab === "Closed" && (<>
                  <TableHead>Audit ID</TableHead><TableHead>Created By</TableHead><TableHead>Created On</TableHead><TableHead>Action</TableHead>
                </>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudits.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No audits found.</TableCell></TableRow>
              ) : filteredAudits.map((a) => (
                <TableRow
                  key={a.id}
                  className="cento-row-clickable"
                  onClick={() => navigate(`/audits/${a.id}`, { state: { audit: a } })}
                >
                  <TableCell className="font-medium text-primary">{a.id}</TableCell>
                  {statusTab === "Draft" && (<>
                    <TableCell>{a.createdBy}</TableCell>
                    <TableCell className="text-muted-foreground">{a.createdOn}</TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </>)}
                  {statusTab === "InReview" && (<>
                    <TableCell className="text-muted-foreground">{a.createdOn}</TableCell>
                    <TableCell>{a.createdBy}</TableCell>
                    <TableCell className="text-muted-foreground">{a.auditDate ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.auditTime ?? "—"}</TableCell>
                    <TableCell>{a.materialCount ?? 0}</TableCell>
                  </>)}
                  {statusTab === "Closed" && (<>
                    <TableCell>{a.createdBy}</TableCell>
                    <TableCell className="text-muted-foreground">{a.createdOn}</TableCell>
                    <TableCell><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></TableCell>
                  </>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
