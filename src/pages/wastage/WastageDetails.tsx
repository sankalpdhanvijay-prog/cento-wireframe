import { useState, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "@/hooks/use-toast";

const WASTAGE_CATEGORIES = ["Expired", "Spoiled", "Damaged", "Overscooping", "Burnt", "Other"];

interface WastageMaterial {
  code: string; name: string; category: string; wastageQty: number; wastageCategory: string; batch: string;
}

interface WastageEntry {
  id: string; createdBy: string; createdOn: string; referenceId: string; wastageAmount: number;
  status: "Draft" | "InReview" | "Closed" | "Rejected"; materials: WastageMaterial[];
}

export default function WastageDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const wastage = (location.state?.wastage as WastageEntry) || null;
  const [search, setSearch] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "draft" | "template" | "log" | "approve" | "reject">(null);

  const materials = wastage?.materials ?? [];
  const status = wastage?.status ?? "Draft";

  const filtered = useMemo(() => {
    if (!search.trim()) return materials;
    const q = search.toLowerCase();
    return materials.filter((m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
  }, [materials, search]);

  const handleConfirm = () => {
    const msgs: Record<string, string> = {
      draft: "Wastage saved as draft.", template: "Wastage saved as template.",
      log: "Wastage logged.", approve: "Wastage approved.", reject: "Wastage rejected.",
    };
    toast({ title: "Success", description: msgs[confirmAction!] ?? "" });
    if (confirmAction === "reject") {
      navigate("/wastage", { state: { tab: "Rejected" } });
    } else {
      navigate("/wastage");
    }
    setConfirmAction(null);
  };

  if (!wastage) {
    return (
      <div className="space-y-4 max-w-[1200px]">
        <h1 className="cento-page-title text-xl">Wastage Details</h1>
        <p className="text-muted-foreground">Wastage {id} not found.</p>
        <Button variant="outline" onClick={() => navigate("/wastage")}>Back to Wastages</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div>
        <h1 className="cento-page-title text-xl">Wastage: {wastage.id}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {status === "Draft" && "Edit and update this draft wastage."}
          {status === "InReview" && "Review and approve this wastage."}
          {status === "Closed" && "View closed wastage details."}
          {status === "Rejected" && "View rejected wastage details."}
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
                <TableHead className="text-right">Wastage Qty</TableHead>
                <TableHead>Wastage Category</TableHead>
                <TableHead>Batch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No materials found.</TableCell></TableRow>
              ) : filtered.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{m.code}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-muted-foreground">{m.category}</TableCell>
                  <TableCell className="text-right">
                    {status === "Draft" ? (
                      <Input type="number" className="h-8 w-20 text-xs text-right ml-auto" defaultValue={m.wastageQty} />
                    ) : m.wastageQty}
                  </TableCell>
                  <TableCell>
                    {status === "Draft" ? (
                      <Select defaultValue={m.wastageCategory}>
                        <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WASTAGE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : m.wastageCategory}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.batch}</TableCell>
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
            <Button variant="cento" size="sm" onClick={() => setConfirmAction("log")}>Log Wastage</Button>
          </div>
        )}
        {status === "InReview" && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmAction("draft")}>Save as Draft</Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setConfirmAction("reject")}>Reject</Button>
              <Button variant="cento" size="sm" onClick={() => setConfirmAction("approve")}>Approve</Button>
            </div>
          </div>
        )}
        {/* Closed & Rejected: no CTAs */}
      </div>

      {(["draft", "template", "log", "approve", "reject"] as const).map((action) => (
        <ConfirmationModal
          key={action}
          open={confirmAction === action}
          onOpenChange={() => setConfirmAction(null)}
          title={`${action === "draft" ? "Save Draft" : action === "template" ? "Save Template" : action === "log" ? "Log Wastage" : action === "approve" ? "Approve Wastage" : "Reject Wastage"} Confirmation`}
          description={`Clicking on Confirm will ${action === "draft" ? "save this wastage as a draft" : action === "template" ? "save this wastage as a template" : action === "log" ? "log this wastage" : action === "approve" ? "approve this wastage" : "reject this wastage"}.`}
          onConfirm={handleConfirm}
          confirmLabel="Confirm"
          confirmVariant={action === "reject" ? "destructive" : "default"}
        />
      ))}
    </div>
  );
}
