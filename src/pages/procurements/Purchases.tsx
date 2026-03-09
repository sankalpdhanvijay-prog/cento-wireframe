import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { usePOStore, type PurchaseOrder, type POStatus } from "@/context/POStoreContext";
import { cn } from "@/lib/utils";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const TAB_KEY: Record<string, POStatus> = {
  drafted: "Drafted",
  raised: "Raised",
  approved: "Approved",
  rejected: "Rejected",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const MOCK_PO_TEMPLATES = [
  { id: "tpl1", name: "Weekly Staples", supplierType: "Vendor" as const, createdBy: "Admin", createdAt: "2026-01-15", materialIds: ["m1", "m4", "m8"] },
  { id: "tpl2", name: "Dairy Restock", supplierType: "Vendor" as const, createdBy: "Meera", createdAt: "2026-01-20", materialIds: ["m7"] },
  { id: "tpl3", name: "Inter-branch Produce", supplierType: "Outlet" as const, createdBy: "Ankit", createdAt: "2026-02-01", materialIds: ["m4", "m5", "m9"] },
  { id: "tpl4", name: "Spice Kit", supplierType: "Vendor" as const, createdBy: "Raj", createdAt: "2026-02-05", materialIds: ["m6", "m12"] },
];

export default function Purchases() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, deleteOrder } = usePOStore();

  const initialTab = (location.state as { tab?: string } | null)?.tab ?? "drafted";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const activeStatus = TAB_KEY[tab];

  const rows = useMemo(() => {
    return orders.filter((r) => {
      if (r.status !== activeStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !r.vendor.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, activeStatus, search]);

  const handleDelete = () => {
    if (deleteTarget) deleteOrder(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleUseTemplate = (template: typeof MOCK_PO_TEMPLATES[0]) => {
    navigate("/procurements/new-purchase", {
      state: {
        templateSupplierType: template.supplierType,
        templateMaterialIds: template.materialIds,
      },
    });
  };

  const renderColumns = () => {
    switch (tab) {
      case "drafted":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Supplier Type</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </>
        );
      case "raised":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Supplier Type</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </>
        );
      case "approved":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Supplier Type</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead>Approved On</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </>
        );
      case "cancelled":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Supplier Type</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Cancelled Date</TableHead>
            <TableHead>Cancelled By</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </>
        );
      default:
        return null;
    }
  };

  const supplierBadge = (row: PurchaseOrder) => (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
      row.supplierType === "Outlet" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-border"
    )}>
      {row.supplierType || "Vendor"}
    </Badge>
  );

  const viewBtn = (row: PurchaseOrder) => (
    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/purchases/${row.id}`)}>
      <Eye className="h-3 w-3 mr-1" /> View Details
    </Button>
  );

  const renderRow = (row: PurchaseOrder) => {
    switch (tab) {
      case "drafted":
        return (
          <TableRow key={row.id} className="hover:bg-muted/20">
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{supplierBadge(row)}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell className="text-muted-foreground">{row.lastUpdated}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                {viewBtn(row)}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        );
      case "raised":
        return (
          <TableRow key={row.id} className="hover:bg-muted/20">
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{supplierBadge(row)}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell>{viewBtn(row)}</TableCell>
          </TableRow>
        );
      case "approved":
        return (
          <TableRow key={row.id} className="hover:bg-muted/20">
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{supplierBadge(row)}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell className="text-muted-foreground">{row.approvedOn ?? "—"}</TableCell>
            <TableCell>{viewBtn(row)}</TableCell>
          </TableRow>
        );
      case "cancelled":
        return (
          <TableRow key={row.id} className="hover:bg-muted/20">
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{supplierBadge(row)}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-muted-foreground">{row.cancelledDate}</TableCell>
            <TableCell>{row.cancelledBy}</TableCell>
            <TableCell>{viewBtn(row)}</TableCell>
          </TableRow>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Purchases</h1>
        <Button variant="cento" onClick={() => navigate("/procurements/new-purchase")}>
          <Plus className="h-4 w-4" /> Raise PO
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs value={showTemplates ? "" : tab} onValueChange={(v) => { setTab(v); setShowTemplates(false); }} className="flex-1">
          <div className="flex items-center gap-3">
            <TabsList className="bg-muted/60 p-1 h-auto gap-0.5">
              <TabsTrigger value="drafted" className="text-xs px-3 py-1.5">Drafted</TabsTrigger>
              <TabsTrigger value="raised" className="text-xs px-3 py-1.5">Raised</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs px-3 py-1.5">Approved</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs px-3 py-1.5">Cancelled</TabsTrigger>
            </TabsList>

            <button
              onClick={() => setShowTemplates(true)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg border-2 transition-all",
                showTemplates
                  ? "border-primary bg-cento-yellow-tint text-foreground shadow-sm"
                  : "border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              Templates
            </button>
          </div>

          {!showTemplates && (
            <>
              <div className="mt-3 mb-1">
                <div className="relative w-72">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by PO ID or vendor..."
                    className="pl-8 h-9 text-xs bg-card"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {Object.keys(TAB_KEY).map((key) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <div className="cento-card p-0 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">{renderColumns()}</TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                              No purchases found in this status.
                            </TableCell>
                          </TableRow>
                        ) : (
                          rows.map(renderRow)
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </>
          )}
        </Tabs>
      </div>

      {showTemplates && (
        <div className="cento-card p-0 overflow-hidden mt-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Template Name</TableHead>
                <TableHead>Supplier Type</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PO_TEMPLATES.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0",
                      tpl.supplierType === "Outlet" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-border"
                    )}>
                      {tpl.supplierType}
                    </Badge>
                  </TableCell>
                  <TableCell>{tpl.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{tpl.createdAt}</TableCell>
                  <TableCell>
                    <Button
                      variant="cento"
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => handleUseTemplate(tpl)}
                    >
                      Use
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Confirmation"
        description={`Clicking on Confirm will permanently delete PO ${deleteTarget?.id}.`}
        onConfirm={handleDelete}
        confirmLabel="Confirm Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
