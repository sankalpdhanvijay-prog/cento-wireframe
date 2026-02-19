import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Search } from "lucide-react";

interface ClosedOrderRow {
  id: string;
  poId: string;
  grnId: string;
  receivingType: "PO-Based" | "Direct";
  vendor: string;
  outlet: string;
  totalValue: number;
  orderedQty: number;
  receivedQty: number;
  receivingDate: string;
  poCreatedBy: string;
  poCreatedOn: string;
}

const MOCK_CLOSED: ClosedOrderRow[] = [
  { id: "1", poId: "PO-1005", grnId: "GRN-2025-088", receivingType: "PO-Based", vendor: "Fresh Farms Pvt Ltd", outlet: "Main Kitchen", totalValue: 45000, orderedQty: 200, receivedQty: 200, receivingDate: "2025-12-15", poCreatedBy: "Rahul M.", poCreatedOn: "2025-12-01" },
  { id: "2", poId: "PO-1006", grnId: "GRN-2025-089", receivingType: "PO-Based", vendor: "Daily Dairy Supplies", outlet: "Branch - Indiranagar", totalValue: 22000, orderedQty: 100, receivedQty: 95, receivingDate: "2025-12-18", poCreatedBy: "Priya K.", poCreatedOn: "2025-12-05" },
  { id: "3", poId: "—", grnId: "GRN-2025-092", receivingType: "Direct", vendor: "Spice World Traders", outlet: "Main Kitchen", totalValue: 9800, orderedQty: 50, receivedQty: 50, receivingDate: "2026-01-03", poCreatedBy: "Ankit S.", poCreatedOn: "2026-01-03" },
  { id: "4", poId: "PO-1007", grnId: "GRN-2026-004", receivingType: "PO-Based", vendor: "Fresh Farms Pvt Ltd", outlet: "Branch - Koramangala", totalValue: 31500, orderedQty: 140, receivedQty: 140, receivingDate: "2026-01-20", poCreatedBy: "Sona R.", poCreatedOn: "2026-01-08" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ClosedOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!search) return MOCK_CLOSED;
    const q = search.toLowerCase();
    return MOCK_CLOSED.filter(
      (r) =>
        r.poId.toLowerCase().includes(q) ||
        r.grnId.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Closed Orders</h1>
      </div>

      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by PO ID, GRN ID or vendor..."
          className="pl-8 h-9 text-xs bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[110px]">PO ID</TableHead>
              <TableHead className="w-[140px]">GRN ID</TableHead>
              <TableHead>Receiving Type</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead className="text-right">Ordered Qty</TableHead>
              <TableHead className="text-right">Received Qty</TableHead>
              <TableHead>Receiving Date</TableHead>
              <TableHead>PO Created By</TableHead>
              <TableHead>PO Created On</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                  No closed orders found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => navigate(`/procurements/closed-orders/${row.id}`)}
                >
                  <TableCell className="font-medium text-primary">{row.poId}</TableCell>
                  <TableCell className="font-medium text-muted-foreground">{row.grnId}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${row.receivingType === "PO-Based" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {row.receivingType}
                    </span>
                  </TableCell>
                  <TableCell>{row.vendor}</TableCell>
                  <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
                  <TableCell className="text-right">{row.orderedQty}</TableCell>
                  <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
                  <TableCell className="text-muted-foreground">{row.receivingDate}</TableCell>
                  <TableCell>{row.poCreatedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{row.poCreatedOn}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
