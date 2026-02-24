import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDispatchStore } from "@/context/DispatchStoreContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "@/hooks/use-toast";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Dispatches() {
  const navigate = useNavigate();
  const { newDispatches, dispatches, updateDispatchStatus } = useDispatchStore();
  const [activeTab, setActiveTab] = useState<"new" | "all" | "deleted">("new");
  const [search, setSearch] = useState("");
  const [closeTarget, setCloseTarget] = useState<string | null>(null);

  const allDispatches = useMemo(() => dispatches.filter((d) => d.status !== "Deleted"), [dispatches]);
  const deletedDispatches = useMemo(() => dispatches.filter((d) => d.status === "Deleted"), [dispatches]);

  const filteredNew = useMemo(() => {
    if (!search.trim()) return newDispatches;
    const q = search.toLowerCase();
    return newDispatches.filter((d) => d.requisitionId.toLowerCase().includes(q) || d.raisedBy.toLowerCase().includes(q));
  }, [newDispatches, search]);

  const filteredAll = useMemo(() => {
    if (!search.trim()) return allDispatches;
    const q = search.toLowerCase();
    return allDispatches.filter((d) => d.id.toLowerCase().includes(q) || d.requisitionId.toLowerCase().includes(q) || d.deliverTo.toLowerCase().includes(q));
  }, [allDispatches, search]);

  const filteredDeleted = useMemo(() => {
    if (!search.trim()) return deletedDispatches;
    const q = search.toLowerCase();
    return deletedDispatches.filter((d) => d.id.toLowerCase().includes(q) || d.requisitionId.toLowerCase().includes(q));
  }, [deletedDispatches, search]);

  const handleCloseDispatch = () => {
    if (closeTarget) {
      updateDispatchStatus(closeTarget, "Closed");
      toast({ title: "Dispatch Closed", description: `${closeTarget} has been closed.` });
    }
    setCloseTarget(null);
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Dispatches</h1>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab("new")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg border-2 transition-all", activeTab === "new" ? "border-primary bg-cento-yellow-tint text-foreground shadow-sm" : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
          New Dispatches
        </button>
        <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
          <button onClick={() => setActiveTab("all")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", activeTab === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>All Dispatches</button>
          <button onClick={() => setActiveTab("deleted")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", activeTab === "deleted" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Deleted</button>
        </div>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {activeTab === "new" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Requisition ID</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Requisition Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNew.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No new dispatches pending.</TableCell></TableRow>
              ) : filteredNew.map((d) => (
                <TableRow
                  key={d.requisitionId}
                  className="cento-row-clickable"
                  onClick={() => navigate(`/operations/dispatches/new-dispatch`, { state: { requisitionId: d.requisitionId, type: d.type } })}
                >
                  <TableCell className="font-medium text-primary">{d.requisitionId}</TableCell>
                  <TableCell>{d.raisedBy}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(d.totalValue)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.requisitionDate}</TableCell>
                  <TableCell className="text-muted-foreground">{d.expectedDeliveryDate}</TableCell>
                  <TableCell className="text-muted-foreground">{d.lastUpdated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "all" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>GDN ID</TableHead>
                <TableHead>Dispatch Date</TableHead>
                <TableHead>Deliver To</TableHead>
                <TableHead>Requisition ID</TableHead>
                <TableHead>GRN ID</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead className="text-right">Invoice Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAll.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No dispatches found.</TableCell></TableRow>
              ) : filteredAll.map((d) => (
                <TableRow
                  key={d.id}
                  className="cento-row-clickable"
                  onClick={() => {
                    if (d.status === "In Transit") {
                      setCloseTarget(d.id);
                    } else {
                      navigate(`/operations/dispatches/${d.id}`);
                    }
                  }}
                >
                  <TableCell className="font-medium text-primary">{d.id}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dispatchDate}</TableCell>
                  <TableCell>{d.deliverTo}</TableCell>
                  <TableCell className="font-medium">{d.requisitionId}</TableCell>
                  <TableCell className="text-muted-foreground">{d.grnId ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.invoiceId ?? "—"}</TableCell>
                  <TableCell className="text-right">{d.invoiceAmount ? fmt(d.invoiceAmount) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", d.status === "Closed" ? "border-green-200 text-green-700 bg-green-50" : "border-amber-200 text-amber-700 bg-amber-50")}>
                      {d.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "deleted" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>GDN ID</TableHead>
                <TableHead>Dispatch Date</TableHead>
                <TableHead>Deliver To</TableHead>
                <TableHead>Requisition ID</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeleted.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No deleted dispatches.</TableCell></TableRow>
              ) : filteredDeleted.map((d) => (
                <TableRow key={d.id} className="cento-row-clickable" onClick={() => navigate(`/operations/dispatches/${d.id}`)}>
                  <TableCell className="font-medium">{d.id}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dispatchDate}</TableCell>
                  <TableCell>{d.deliverTo}</TableCell>
                  <TableCell>{d.requisitionId}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-600 bg-red-50">Deleted</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmationModal
        open={!!closeTarget}
        onOpenChange={() => setCloseTarget(null)}
        title="Close Dispatch Confirmation"
        description="Clicking on Confirm will close this dispatch and mark it as completed."
        onConfirm={handleCloseDispatch}
        confirmLabel="Confirm"
      />
    </div>
  );
}
