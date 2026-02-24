import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface GRNRow {
  id: string;
  grnId: string;
  poId?: string;
  receivingType: "PO-Based" | "Direct";
  vendor: string;
  outlet: string;
  totalValue: number;
  orderedQty: number;
  receivedQty: number;
  pendingQty?: number;
  receivingDate: string;
  poCreatedBy: string;
  poCreatedOn: string;
  status: "Drafted" | "Received" | "Partially Received" | "Cancelled";
}

const MOCK_GRNS: GRNRow[] = [
  { id: "1", grnId: "GRN-2026-001", poId: "PO-1001", receivingType: "PO-Based", vendor: "Fresh Farms Pvt Ltd", outlet: "Main Kitchen", totalValue: 32500, orderedQty: 150, receivedQty: 120, pendingQty: 30, receivingDate: "2026-02-10", poCreatedBy: "Rahul M.", poCreatedOn: "2026-01-20", status: "Partially Received" },
  { id: "2", grnId: "GRN-2026-002", receivingType: "Direct", vendor: "Spice World Traders", outlet: "Main Kitchen", totalValue: 8750, orderedQty: 45, receivedQty: 45, receivingDate: "2026-02-09", poCreatedBy: "Priya K.", poCreatedOn: "2026-02-09", status: "Received" },
  { id: "3", grnId: "GRN-2026-003", poId: "PO-1002", receivingType: "PO-Based", vendor: "Daily Dairy Supplies", outlet: "Branch - Indiranagar", totalValue: 28800, orderedQty: 80, receivedQty: 80, receivingDate: "2026-02-08", poCreatedBy: "Ankit S.", poCreatedOn: "2026-01-15", status: "Received" },
  { id: "4", grnId: "GRN-2026-004", receivingType: "Direct", vendor: "Fresh Farms Pvt Ltd", outlet: "Branch - Koramangala", totalValue: 4200, orderedQty: 30, receivedQty: 0, receivingDate: "2026-02-07", poCreatedBy: "Sona R.", poCreatedOn: "2026-02-07", status: "Drafted" },
  { id: "5", grnId: "GRN-2026-005", poId: "PO-1003", receivingType: "PO-Based", vendor: "Daily Dairy Supplies", outlet: "Main Kitchen", totalValue: 54000, orderedQty: 200, receivedQty: 180, pendingQty: 20, receivingDate: "2026-02-11", poCreatedBy: "Rahul M.", poCreatedOn: "2026-01-28", status: "Partially Received" },
  { id: "6", grnId: "GRN-2026-006", poId: "PO-1004", receivingType: "PO-Based", vendor: "Spice World Traders", outlet: "Main Kitchen", totalValue: 12000, orderedQty: 60, receivedQty: 0, receivingDate: "-", poCreatedBy: "Priya K.", poCreatedOn: "2026-02-01", status: "Cancelled" },
];

const TAB_KEY: Record<string, GRNRow["status"]> = {
  drafted: "Drafted",
  received: "Received",
  partial: "Partially Received",
  cancelled: "Cancelled",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Receivings() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as { tab?: string } | null)?.tab ?? "drafted";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [grns, setGrns] = useState<GRNRow[]>(MOCK_GRNS);
  const [deleteTarget, setDeleteTarget] = useState<GRNRow | null>(null);

  const activeStatus = TAB_KEY[tab];

  const rows = useMemo(() => {
    return grns.filter((r) => {
      if (r.status !== activeStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.grnId.toLowerCase().includes(q) &&
          !r.vendor.toLowerCase().includes(q) &&
          !(r.poId || "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [grns, activeStatus, search]);

  const handleDelete = () => {
    if (deleteTarget) setGrns((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const renderColumns = () => {
    switch (tab) {
      case "partial":
        return (
          <>
            <TableHead className="w-[120px]">GRN ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead className="text-right">Pending Qty</TableHead>
            <TableHead>Receiving Date</TableHead>
            <TableHead>PO Created By</TableHead>
            <TableHead>PO Created On</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "received":
        return (
          <>
            <TableHead className="w-[120px]">GRN ID</TableHead>
            <TableHead>Receiving Type</TableHead>
            <TableHead>PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead>Receiving Date</TableHead>
            <TableHead>PO Created By</TableHead>
            <TableHead>PO Created On</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "drafted":
      case "cancelled":
        return (
          <>
            <TableHead className="w-[120px]">GRN ID</TableHead>
            <TableHead>Receiving Type</TableHead>
            <TableHead>PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>PO Created By</TableHead>
            <TableHead>PO Created On</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      default:
        return null;
    }
  };

  const renderRow = (row: GRNRow) => {
    const detailPath = `/procurements/receivings/${row.id}`;
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

    const typeBadge = (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.receivingType === "PO-Based" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
        {row.receivingType}
      </span>
    );

    switch (tab) {
      case "partial":
        return (
          <TableRow key={row.id} className="cento-row-clickable" onClick={() => navigate(detailPath)}>
            <TableCell className="font-medium text-primary">{row.grnId}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.orderedQty}</TableCell>
            <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
            <TableCell className="text-right text-amber-600 font-medium">{row.pendingQty ?? 0}</TableCell>
            <TableCell className="text-muted-foreground">{row.receivingDate}</TableCell>
            <TableCell>{row.poCreatedBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.poCreatedOn}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{deleteBtn}</TableCell>
          </TableRow>
        );
      case "received":
        return (
          <TableRow key={row.id} className="cento-row-clickable" onClick={() => navigate(detailPath)}>
            <TableCell className="font-medium text-primary">{row.grnId}</TableCell>
            <TableCell>{typeBadge}</TableCell>
            <TableCell className="text-muted-foreground">{row.poId ?? "—"}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.orderedQty}</TableCell>
            <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
            <TableCell className="text-muted-foreground">{row.receivingDate}</TableCell>
            <TableCell>{row.poCreatedBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.poCreatedOn}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{deleteBtn}</TableCell>
          </TableRow>
        );
      case "drafted":
      case "cancelled":
        return (
          <TableRow key={row.id} className="cento-row-clickable" onClick={() => navigate(detailPath)}>
            <TableCell className="font-medium text-primary">{row.grnId}</TableCell>
            <TableCell>{typeBadge}</TableCell>
            <TableCell className="text-muted-foreground">{row.poId ?? "—"}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell>{row.poCreatedBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.poCreatedOn}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{deleteBtn}</TableCell>
          </TableRow>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Receivings</h1>
        <Button variant="cento" onClick={() => navigate("/procurements/new-receiving/create")}>
          <Plus className="h-4 w-4" /> Raise Receiving
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 h-auto gap-0.5">
          <TabsTrigger value="drafted" className="text-xs px-3 py-1.5">Drafted</TabsTrigger>
          <TabsTrigger value="received" className="text-xs px-3 py-1.5">Received</TabsTrigger>
          <TabsTrigger value="partial" className="text-xs px-3 py-1.5">Partially Received</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs px-3 py-1.5">Cancelled</TabsTrigger>
        </TabsList>

        <div className="mt-3 mb-1">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by GRN ID, PO ID or vendor..."
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
                        No receivings found in this status.
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

      <ConfirmationModal
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Confirmation"
        description={`Clicking on Confirm will permanently delete GRN ${deleteTarget?.grnId}.`}
        onConfirm={handleDelete}
        confirmLabel="Confirm Delete"
        confirmVariant="destructive"
      />
    </div>
  );
}
