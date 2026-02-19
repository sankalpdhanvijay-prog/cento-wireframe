import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { usePOStore, type PurchaseOrder, type POStatus } from "@/context/POStoreContext";

const PURCHASE_TABS: POStatus[] = ["Drafted", "Raised", "Approved", "Cancelled"];

const TAB_KEY: Record<string, POStatus> = {
  drafted: "Drafted",
  raised: "Raised",
  approved: "Approved",
  cancelled: "Cancelled",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Purchases() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, deleteOrder } = usePOStore();

  // Allow the tab to be set via navigation state (e.g. after draft/generate)
  const initialTab = (location.state as { tab?: string } | null)?.tab ?? "drafted";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

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

  const renderColumns = () => {
    switch (tab) {
      case "drafted":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "raised":
      case "approved":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "cancelled":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Cancelled Date</TableHead>
            <TableHead>Cancelled By</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      default:
        return null;
    }
  };

  const renderRow = (row: PurchaseOrder) => {
    const detailPath = `/procurements/purchases/${row.id}`;
    const deleteBtn = tab === "drafted" ? (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    ) : null;

    switch (tab) {
      case "drafted":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(detailPath)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell className="text-muted-foreground">{row.lastUpdated}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{deleteBtn}</TableCell>
          </TableRow>
        );
      case "raised":
      case "approved":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(detailPath)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell />
          </TableRow>
        );
      case "cancelled":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(detailPath)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-muted-foreground">{row.cancelledDate}</TableCell>
            <TableCell>{row.cancelledBy}</TableCell>
            <TableCell />
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

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 h-auto gap-0.5">
          <TabsTrigger value="drafted" className="text-xs px-3 py-1.5">Drafted</TabsTrigger>
          <TabsTrigger value="raised" className="text-xs px-3 py-1.5">Raised</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs px-3 py-1.5">Approved</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs px-3 py-1.5">Cancelled</TabsTrigger>
        </TabsList>

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
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
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
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft PO?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. PO <span className="font-semibold">{deleteTarget?.id}</span> will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
