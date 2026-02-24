import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { useTransferStore, type TransferOrder, type TransferStatus } from "@/context/TransferStoreContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const TAB_KEY: Record<string, TransferStatus> = {
  drafted: "Drafted",
  raised: "Raised",
  approved: "Approved",
  cancelled: "Cancelled",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Transfers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { transfers, deleteTransfer } = useTransferStore();

  const initialTab = (location.state as { tab?: string } | null)?.tab ?? "drafted";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TransferOrder | null>(null);

  const activeStatus = TAB_KEY[tab];

  const rows = useMemo(() => {
    return transfers.filter((r) => {
      if (r.status !== activeStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !r.senderOutlet.toLowerCase().includes(q) && !r.buyerOutlet.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [transfers, activeStatus, search]);

  const handleDelete = () => {
    if (deleteTarget) deleteTransfer(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Transfers</h1>
        <Button variant="cento" onClick={() => navigate("/operations/transfers/new-transfer")}>
          <Plus className="h-4 w-4" /> Raise Transfer
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
              placeholder="Search by STN ID or outlet..."
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
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[100px]">STN ID</TableHead>
                    <TableHead>Sender Outlet</TableHead>
                    <TableHead>Buyer Outlet</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Total Qty</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created On</TableHead>
                    {key === "approved" && <TableHead>Approved On</TableHead>}
                    {key === "drafted" && <TableHead>Last Updated</TableHead>}
                    {key === "cancelled" && <TableHead>Cancelled Date</TableHead>}
                    {key === "cancelled" && <TableHead>Cancelled By</TableHead>}
                    <TableHead className="w-[48px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        No transfers found in this status.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cento-row-clickable"
                        onClick={() => navigate(`/operations/transfers/${row.id}`)}
                      >
                        <TableCell className="font-medium text-primary">{row.id}</TableCell>
                        <TableCell>{row.senderOutlet}</TableCell>
                        <TableCell className="text-muted-foreground">{row.buyerOutlet}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
                        <TableCell className="text-right">{row.totalQty}</TableCell>
                        <TableCell>{row.createdBy}</TableCell>
                        <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
                        {key === "approved" && <TableCell className="text-muted-foreground">{row.approvedOn ?? "—"}</TableCell>}
                        {key === "drafted" && <TableCell className="text-muted-foreground">{row.lastUpdated ?? "—"}</TableCell>}
                        {key === "cancelled" && <TableCell className="text-muted-foreground">{row.cancelledDate}</TableCell>}
                        {key === "cancelled" && <TableCell>{row.cancelledBy}</TableCell>}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Confirmation"
        description={`Clicking on Confirm will permanently delete Transfer ${deleteTarget?.id}.`}
        onConfirm={handleDelete}
        confirmLabel="Confirm Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
