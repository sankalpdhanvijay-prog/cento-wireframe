import { useState, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "@/hooks/use-toast";

interface AuditMaterial {
  code: string; name: string; category: string; systemStock: number; actualStock: number; variance: number; percentVariance: number; batchName: string; reason: string; costVariance?: number; countVariance?: number;
}

interface AuditEntry {
  id: string; createdBy: string; createdOn: string; status: "Draft" | "InReview" | "Closed" | "Rejected";
  materials: AuditMaterial[];
}

export default function AuditDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const audit = (location.state?.audit as AuditEntry) || null;
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "draft" | "template" | "update" | "reject" | "approve" | "close">(null);

  const materials = audit?.materials ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return materials;
    const q = search.toLowerCase();
    return materials.filter((m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [materials, search]);

  const status = audit?.status ?? "Draft";

  const handleConfirm = () => {
    const msgs: Record<string, string> = {
      draft: "Audit saved as draft.", template: "Audit saved as template.",
      update: "Inventory updated.", reject: "Audit rejected.", approve: "Audit approved.", close: "Audit closed.",
    };
    toast({ title: "Success", description: msgs[confirmAction!] ?? "" });
    if (confirmAction === "reject") {
      navigate("/audits", { state: { tab: "Rejected" } });
    } else {
      navigate("/audits");
    }
    setConfirmAction(null);
  };

  if (!audit) {
    return (
      <div className="space-y-4 max-w-[1200px]">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <h1 className="cento-page-title text-xl">Audit Details</h1>
        <p className="text-muted-foreground">Audit {id} not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1200px]">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

      <div>
        <h1 className="cento-page-title text-xl">Audit: {audit.id}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {status === "Draft" && "Edit and update this draft audit."}
          {status === "InReview" && "Review and approve this audit."}
          {status === "Closed" && "View closed audit details."}
          {status === "Rejected" && "View rejected audit details."}
        </p>
      </div>

      <div className="cento-card p-4 space-y-4">
        <h2 className="cento-section-header text-sm font-semibold">Material Details</h2>
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search materials..." className="pl-8 h-9 text-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">System Stock</TableHead>
                <TableHead className="text-right">Actual Stock</TableHead>
                {(status === "Draft" || status === "InReview") && (<>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">% Variance</TableHead>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Reason</TableHead>
                </>)}
                {(status === "Closed" || status === "Rejected") && (<>
                  <TableHead className="text-right">Cost Variance</TableHead>
                  <TableHead className="text-right">Count Variance</TableHead>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Reason</TableHead>
                </>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No materials found.</TableCell></TableRow>
              ) : filtered.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.category}</TableCell>
                  <TableCell className="text-right">{m.systemStock}</TableCell>
                  <TableCell className="text-right">
                    {status === "Draft" ? (
                      <Input type="number" className="h-8 w-20 text-xs text-right ml-auto" defaultValue={m.actualStock} />
                    ) : m.actualStock}
                  </TableCell>
                  {(status === "Draft" || status === "InReview") && (<>
                    <TableCell className="text-right">{m.variance}</TableCell>
                    <TableCell className="text-right">{m.percentVariance.toFixed(2)}%</TableCell>
                    <TableCell>{status === "Draft" ? <Input className="h-8 w-24 text-xs" defaultValue={m.batchName} /> : <span className="text-muted-foreground">{m.batchName}</span>}</TableCell>
                    <TableCell className="text-muted-foreground">{m.reason}</TableCell>
                  </>)}
                  {(status === "Closed" || status === "Rejected") && (<>
                    <TableCell className="text-right">{m.costVariance ?? "—"}</TableCell>
                    <TableCell className="text-right">{m.countVariance ?? m.variance}</TableCell>
                    <TableCell className="text-muted-foreground">{m.batchName}</TableCell>
                    <TableCell className="text-muted-foreground">{m.reason}</TableCell>
                  </>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {status === "Draft" && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("draft")}>Save as Draft</Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("template")}>Save as Template</Button>
            </div>
            <Button variant="cento" size="sm" onClick={() => setConfirmAction("update")}>Update Inventory</Button>
          </div>
        )}
        {status === "InReview" && (
          <div className="flex items-center justify-between pt-2">
            <div />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("reject")}>Reject</Button>
              <Button variant="cento" size="sm" onClick={() => setConfirmAction("close")}>Approve and Close Audit</Button>
            </div>
          </div>
        )}
      </div>

      {(["draft", "template", "update", "reject", "approve", "close"] as const).map((action) => (
        <ConfirmationModal
          key={action}
          open={confirmAction === action}
          onOpenChange={() => setConfirmAction(null)}
          title={`${action === "draft" ? "Save Draft" : action === "template" ? "Save Template" : action === "update" ? "Update Inventory" : action === "reject" ? "Reject Audit" : action === "close" ? "Close Audit" : "Approve"} Confirmation`}
          description={`Clicking on Confirm will ${action === "draft" ? "save this audit as a draft" : action === "template" ? "save this audit as a template" : action === "update" ? "update the inventory" : action === "reject" ? "reject this audit" : action === "close" ? "approve and close this audit" : "approve this audit"}.`}
          onConfirm={handleConfirm}
          confirmLabel="Confirm"
        />
      ))}
    </div>
  );
}
