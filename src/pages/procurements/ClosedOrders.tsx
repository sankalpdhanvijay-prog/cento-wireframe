import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Search, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ClosedOrderRow {
  id: string;
  orderId: string;
  supplierType: "Vendor" | "Outlet" | "Transfer";
  supplier: string;
  orderedAt: string;
  expectedDelivery: string;
  orderedQty: number;
  receivedQty: number;
  lastReceivingDate: string;
  orderAmount: number;
  closedAt: string;
  receivings: {
    requisitionId: string;
    receivedQty: number;
    orderAmount: number;
    invoiceAmount: number;
    creationDate: string;
    createdBy: string;
    receivingDate: string;
  }[];
  shortSupply?: { materialName: string; orderedQty: number; receivedQty: number; shortQty: number }[];
}

const MOCK_CLOSED: ClosedOrderRow[] = [
  {
    id: "co1", orderId: "PO-1005", supplierType: "Vendor", supplier: "Fresh Farms Pvt Ltd",
    orderedAt: "2025-12-01", expectedDelivery: "2025-12-10", orderedQty: 200, receivedQty: 200,
    lastReceivingDate: "2025-12-15", orderAmount: 45000, closedAt: "2025-12-16",
    receivings: [
      { requisitionId: "PO-1005", receivedQty: 120, orderAmount: 27000, invoiceAmount: 26800, creationDate: "2025-12-08", createdBy: "Rahul M.", receivingDate: "2025-12-10" },
      { requisitionId: "PO-1005", receivedQty: 80, orderAmount: 18000, invoiceAmount: 18000, creationDate: "2025-12-12", createdBy: "Priya K.", receivingDate: "2025-12-15" },
    ],
  },
  {
    id: "co2", orderId: "PO-1006", supplierType: "Vendor", supplier: "Daily Dairy Supplies",
    orderedAt: "2025-12-05", expectedDelivery: "2025-12-15", orderedQty: 100, receivedQty: 95,
    lastReceivingDate: "2025-12-18", orderAmount: 22000, closedAt: "2025-12-19",
    receivings: [
      { requisitionId: "PO-1006", receivedQty: 95, orderAmount: 20900, invoiceAmount: 20800, creationDate: "2025-12-14", createdBy: "Priya K.", receivingDate: "2025-12-18" },
    ],
    shortSupply: [
      { materialName: "Full Cream Milk", orderedQty: 50, receivedQty: 45, shortQty: 5 },
    ],
  },
  {
    id: "co3", orderId: "TO-2001", supplierType: "Transfer", supplier: "Main Kitchen",
    orderedAt: "2026-01-03", expectedDelivery: "2026-01-08", orderedQty: 50, receivedQty: 50,
    lastReceivingDate: "2026-01-07", orderAmount: 9800, closedAt: "2026-01-08",
    receivings: [
      { requisitionId: "GDN-3001", receivedQty: 50, orderAmount: 9800, invoiceAmount: 9800, creationDate: "2026-01-05", createdBy: "Ankit S.", receivingDate: "2026-01-07" },
    ],
  },
  {
    id: "co4", orderId: "PO-1007", supplierType: "Outlet", supplier: "Fresh Farms Pvt Ltd",
    orderedAt: "2026-01-08", expectedDelivery: "2026-01-18", orderedQty: 140, receivedQty: 140,
    lastReceivingDate: "2026-01-20", orderAmount: 31500, closedAt: "2026-01-21",
    receivings: [
      { requisitionId: "GDN-3005", receivedQty: 80, orderAmount: 18000, invoiceAmount: 17900, creationDate: "2026-01-12", createdBy: "Sona R.", receivingDate: "2026-01-15" },
      { requisitionId: "GDN-3006", receivedQty: 60, orderAmount: 13500, invoiceAmount: 13500, creationDate: "2026-01-18", createdBy: "Ankit S.", receivingDate: "2026-01-20" },
    ],
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const TYPE_BADGE: Record<string, string> = {
  Vendor: "bg-blue-50 text-blue-700 border-blue-200",
  Outlet: "bg-purple-50 text-purple-700 border-purple-200",
  Transfer: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function ClosedOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    if (!search) return MOCK_CLOSED;
    const q = search.toLowerCase();
    return MOCK_CLOSED.filter(
      (r) =>
        r.orderId.toLowerCase().includes(q) ||
        r.supplier.toLowerCase().includes(q)
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
          placeholder="Search by Order ID or supplier..."
          className="pl-8 h-9 text-xs bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Supplier Type</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Ordered At</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead className="text-right">Ordered Qty</TableHead>
              <TableHead className="text-right">Received Qty</TableHead>
              <TableHead>Last Receiving Date</TableHead>
              <TableHead className="text-right">Order Amount</TableHead>
              <TableHead>Closed At</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
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
                <TableRow key={row.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-primary">{row.orderId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TYPE_BADGE[row.supplierType])}>
                      {row.supplierType}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell className="text-muted-foreground">{row.orderedAt}</TableCell>
                  <TableCell className="text-muted-foreground">{row.expectedDelivery}</TableCell>
                  <TableCell className="text-right">{row.orderedQty}</TableCell>
                  <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
                  <TableCell className="text-muted-foreground">{row.lastReceivingDate}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(row.orderAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">{row.closedAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs h-7"
                      onClick={() => navigate(`/procurements/closed-orders/${row.id}`, { state: { order: row } })}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
