import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDispatchStore } from "@/context/DispatchStoreContext";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const STATUS_BADGE: Record<string, string> = {
  "In Transit": "border-amber-200 text-amber-700 bg-amber-50",
  "Closed": "border-green-200 text-green-700 bg-green-50",
  "Closed (Partial)": "border-blue-200 text-blue-700 bg-blue-50",
  "Deleted": "border-red-200 text-red-600 bg-red-50",
};

export default function Dispatches() {
  const navigate = useNavigate();
  const { newDispatches, partialDispatches, dispatches } = useDispatchStore();
  const [activeTab, setActiveTab] = useState<"new" | "partial" | "all" | "deleted">("new");
  const [search, setSearch] = useState("");

  const allDispatches = useMemo(() => dispatches.filter((d) => d.status !== "Deleted"), [dispatches]);
  const deletedDispatches = useMemo(() => dispatches.filter((d) => d.status === "Deleted"), [dispatches]);

  const filteredNew = useMemo(() => {
    if (!search.trim()) return newDispatches;
    const q = search.toLowerCase();
    return newDispatches.filter((d) => d.requisitionId.toLowerCase().includes(q) || d.raisedBy.toLowerCase().includes(q));
  }, [newDispatches, search]);

  const filteredPartial = useMemo(() => {
    if (!search.trim()) return partialDispatches;
    const q = search.toLowerCase();
    return partialDispatches.filter((d) => d.requisitionId.toLowerCase().includes(q) || d.raisedBy.toLowerCase().includes(q));
  }, [partialDispatches, search]);

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

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Dispatches</h1>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab("new")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg border-2 transition-all", activeTab === "new" ? "border-primary bg-cento-yellow-tint text-foreground shadow-sm" : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
          New Dispatches
        </button>
        <button onClick={() => setActiveTab("partial")} className={cn("px-4 py-1.5 text-xs font-medium rounded-lg border-2 transition-all", activeTab === "partial" ? "border-primary bg-cento-yellow-tint text-foreground shadow-sm" : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
          Partially Dispatched
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
                <TableHead>Purchase ID</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNew.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No new dispatches pending.</TableCell></TableRow>
              ) : filteredNew.map((d) => (
                <TableRow key={d.requisitionId} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-primary">{d.requisitionId}</TableCell>
                  <TableCell>{d.raisedBy}</TableCell>
                  <TableCell className="text-right">{d.orderedQty}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(d.totalValue)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.requisitionDate}</TableCell>
                  <TableCell className="text-muted-foreground">{d.expectedDeliveryDate}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => navigate(`/operations/dispatches/new-dispatch`, { state: { requisitionId: d.requisitionId, type: d.type } })}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {activeTab === "partial" && (
        <div className="cento-card p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Purchase ID</TableHead>
                <TableHead>Raised By</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Pending Qty</TableHead>
                <TableHead className="text-right">Received Qty</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead className="w-[120px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartial.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No partially dispatched orders.</TableCell></TableRow>
              ) : filteredPartial.map((d) => (
                <TableRow key={d.requisitionId} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-primary">{d.requisitionId}</TableCell>
                  <TableCell>{d.raisedBy}</TableCell>
                  <TableCell className="text-right">{d.orderedQty}</TableCell>
                  <TableCell className="text-right text-amber-600 font-medium">{d.pendingQty}</TableCell>
                  <TableCell className="text-right text-green-600 font-medium">{d.receivedQty}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(d.totalValue)}</TableCell>
                  <TableCell className="text-muted-foreground">{d.requisitionDate}</TableCell>
                  <TableCell className="text-muted-foreground">{d.expectedDeliveryDate}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => navigate(`/operations/dispatches/partial`, { state: { requisitionId: d.requisitionId, type: d.type } })}>
                      <Eye className="h-3 w-3 mr-1" /> View Details
                    </Button>
                  </TableCell>
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
                <TableHead>Purchase ID</TableHead>
                <TableHead>GRN ID</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead className="text-right">Invoice Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAll.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No dispatches found.</TableCell></TableRow>
              ) : filteredAll.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-primary">{d.id}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dispatchDate}</TableCell>
                  <TableCell>{d.deliverTo}</TableCell>
                  <TableCell className="font-medium">{d.requisitionId}</TableCell>
                  <TableCell className="text-muted-foreground">{d.grnId ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.invoiceId ?? "—"}</TableCell>
                  <TableCell className="text-right">{d.invoiceAmount ? fmt(d.invoiceAmount) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", STATUS_BADGE[d.status] || "")}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/operations/dispatches/${d.id}`)}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
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
                <TableHead>Purchase ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeleted.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No deleted dispatches.</TableCell></TableRow>
              ) : filteredDeleted.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{d.id}</TableCell>
                  <TableCell className="text-muted-foreground">{d.dispatchDate}</TableCell>
                  <TableCell>{d.deliverTo}</TableCell>
                  <TableCell>{d.requisitionId}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-600 bg-red-50">Deleted</Badge></TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/operations/dispatches/${d.id}`)}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
