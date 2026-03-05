import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, Eye } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useProductionStore, type Production } from "@/context/ProductionStoreContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function Productions() {
  const navigate = useNavigate();
  const { productions, deleteProduction } = useProductionStore();
  const [activeTab, setActiveTab] = useState<"all" | "deleted">("all");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Production | null>(null);

  const allProds = useMemo(() => productions.filter((p) => !p.deleted), [productions]);
  const deletedProds = useMemo(() => productions.filter((p) => p.deleted), [productions]);

  const displayProds = activeTab === "all" ? allProds : deletedProds;

  const filtered = useMemo(() => {
    if (!search.trim()) return displayProds;
    const q = search.toLowerCase();
    return displayProds.filter((p) => p.id.toLowerCase().includes(q) || p.productionPlan.toLowerCase().includes(q) || p.producedBy.toLowerCase().includes(q));
  }, [displayProds, search]);

  const handleDelete = () => {
    if (deleteTarget) deleteProduction(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Production</h1>
        <Button variant="cento" onClick={() => navigate("/operations/productions/new-production")}>
          <Plus className="h-4 w-4" /> New Production
        </Button>
      </div>

      <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
        <button onClick={() => setActiveTab("all")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", activeTab === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>All Productions</button>
        <button onClick={() => setActiveTab("deleted")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", activeTab === "deleted" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>Deleted Production</button>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search by ID, plan, or produced by..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Production ID</TableHead>
              <TableHead>Production Plan</TableHead>
              <TableHead>Production Date</TableHead>
              <TableHead>Produced By</TableHead>
              <TableHead className="text-right">Total Produced</TableHead>
              <TableHead className="w-[120px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No productions found.</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/20">
                <TableCell className="font-medium text-primary">{p.id}</TableCell>
                <TableCell className="font-medium">{p.productionPlan}</TableCell>
                <TableCell className="text-muted-foreground">{p.productionDate}</TableCell>
                <TableCell>{p.producedBy}</TableCell>
                <TableCell className="text-right">{p.totalProduced}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/operations/productions/${p.id}`)}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                    {!p.deleted && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Confirmation"
        description={`Clicking on Confirm will delete Production ${deleteTarget?.id}.`}
        onConfirm={handleDelete}
        confirmLabel="Confirm Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
