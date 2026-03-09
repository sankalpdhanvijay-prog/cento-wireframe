import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Eye, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WastageEntry {
  materialName: string;
  wastageQty: number;
  shortReason: string;
  grnId: string;
  sessionDate: string;
}

export interface ReceivingSession {
  grnId: string;
  gdnId: string | null;
  acceptedQty: number;
  invoiceAmount: number;
  receivingDate: string;
  receivedBy: string;
}

export interface ClosedOrderRow {
  id: string;
  orderId: string;
  supplierType: "Vendor" | "Outlet" | "Transfer";
  supplier: string;
  outlet: string;
  orderedAt: string;
  expectedDelivery: string;
  orderedQty: number;
  receivedQty: number;
  orderAmount: number;
  closedAt: string;
  closedBy: string;
  closeType: "Auto" | "Manual";
  receivings: ReceivingSession[];
  wastageDetails?: WastageEntry[];
}

const MOCK_CLOSED: ClosedOrderRow[] = [
  {
    id: "co1", orderId: "PO-1005", supplierType: "Vendor", supplier: "Fresh Farms Pvt Ltd", outlet: "Main Kitchen",
    orderedAt: "01 Dec 2025", expectedDelivery: "10 Dec 2025", orderedQty: 200, receivedQty: 200, orderAmount: 45000,
    closedAt: "16 Dec 2025", closedBy: "Rahul M.", closeType: "Auto",
    receivings: [
      { grnId: "GRN-2025-001", gdnId: null, acceptedQty: 120, invoiceAmount: 26800, receivingDate: "10 Dec 2025", receivedBy: "Rahul M." },
      { grnId: "GRN-2025-002", gdnId: null, acceptedQty: 80, invoiceAmount: 18000, receivingDate: "15 Dec 2025", receivedBy: "Priya K." },
    ],
  },
  {
    id: "co2", orderId: "PO-1006", supplierType: "Vendor", supplier: "Daily Dairy Supplies", outlet: "Branch - Indiranagar",
    orderedAt: "05 Dec 2025", expectedDelivery: "15 Dec 2025", orderedQty: 100, receivedQty: 85, orderAmount: 22000,
    closedAt: "19 Dec 2025", closedBy: "Priya K.", closeType: "Manual",
    receivings: [
      { grnId: "GRN-2025-003", gdnId: null, acceptedQty: 85, invoiceAmount: 18700, receivingDate: "18 Dec 2025", receivedBy: "Priya K." },
    ],
  },
  {
    id: "co3", orderId: "TO-2001", supplierType: "Transfer", supplier: "Main Kitchen", outlet: "Branch - Koramangala",
    orderedAt: "03 Jan 2026", expectedDelivery: "08 Jan 2026", orderedQty: 50, receivedQty: 44, orderAmount: 9800,
    closedAt: "08 Jan 2026", closedBy: "Ankit S.", closeType: "Auto",
    receivings: [
      { grnId: "GRN-2026-001", gdnId: "GDN-3001", acceptedQty: 44, invoiceAmount: 8624, receivingDate: "07 Jan 2026", receivedBy: "Ankit S." },
    ],
    wastageDetails: [
      { materialName: "Basmati Rice", wastageQty: 6, shortReason: "Damaged packaging", grnId: "GRN-2026-001", sessionDate: "07 Jan 2026" },
    ],
  },
  {
    id: "co4", orderId: "PO-1007", supplierType: "Outlet", supplier: "Central Warehouse", outlet: "Branch - Indiranagar",
    orderedAt: "08 Jan 2026", expectedDelivery: "18 Jan 2026", orderedQty: 140, receivedQty: 140, orderAmount: 31500,
    closedAt: "21 Jan 2026", closedBy: "Sona R.", closeType: "Auto",
    receivings: [
      { grnId: "GRN-2026-002", gdnId: "GDN-3005", acceptedQty: 80, invoiceAmount: 17900, receivingDate: "15 Jan 2026", receivedBy: "Sona R." },
      { grnId: "GRN-2026-003", gdnId: "GDN-3006", acceptedQty: 60, invoiceAmount: 13500, receivingDate: "20 Jan 2026", receivedBy: "Ankit S." },
    ],
    wastageDetails: [],
  },
];

const MOCK_OUTLETS = [
  { id: "all", name: "All Outlets" },
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

const CURRENT_PERSONA: "SiteUser" | "SiteManager" | "BrandAdmin" | "SuperAdmin" = "BrandAdmin";
const isAdminPersona = CURRENT_PERSONA === "BrandAdmin" || CURRENT_PERSONA === "SuperAdmin";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const TYPE_BADGE: Record<string, string> = {
  Vendor: "bg-blue-50 text-blue-700 border-blue-200",
  Outlet: "bg-purple-50 text-purple-700 border-purple-200",
  Transfer: "bg-teal-50 text-teal-700 border-teal-200",
};

const CLOSE_TYPE_BADGE: Record<string, string> = {
  Auto: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Manual: "bg-slate-50 text-slate-600 border-slate-200",
};

function fulfillmentRate(received: number, ordered: number) {
  if (ordered === 0) return 0;
  return Math.min(100, Math.round((received / ordered) * 100));
}

function FulfillmentBadge({ rate }: { rate: number }) {
  const color =
    rate >= 100 ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : rate >= 50 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";
  return (
    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", color)}>
      {rate}%
    </Badge>
  );
}

export default function ClosedOrders() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [outlet, setOutlet] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState("");

  const handleDateFrom = (v: string) => {
    setDateFrom(v);
    setDateError("");
    if (dateTo && v && new Date(v) > new Date(dateTo)) {
      setDateError("From date cannot be after To date.");
    }
  };
  const handleDateTo = (v: string) => {
    setDateTo(v);
    setDateError("");
    if (dateFrom && v && new Date(dateFrom) > new Date(v)) {
      setDateError("From date cannot be after To date.");
    }
  };

  const rows = useMemo(() => {
    return MOCK_CLOSED.filter((r) => {
      if (isAdminPersona) {
        if (outlet !== "all") {
          const outletName = MOCK_OUTLETS.find((o) => o.id === outlet)?.name;
          if (r.outlet !== outletName) return false;
        }
      } else {
        if (r.outlet !== "Main Kitchen") return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!r.orderId.toLowerCase().includes(q) && !r.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, outlet]);

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Closed Orders</h1>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID or supplier..."
            className="pl-8 h-9 text-xs bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Closed At:</span>
          <Input type="date" value={dateFrom} onChange={(e) => handleDateFrom(e.target.value)} className="h-9 w-36 text-xs bg-card" />
          <span className="text-muted-foreground">→</span>
          <Input type="date" value={dateTo} onChange={(e) => handleDateTo(e.target.value)} className="h-9 w-36 text-xs bg-card" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setDateFrom(""); setDateTo(""); setDateError(""); }}>
              Clear
            </Button>
          )}
        </div>

        {/* Outlet selector — Admin only */}
        {isAdminPersona && (
          <Select value={outlet} onValueChange={setOutlet}>
            <SelectTrigger className="w-[180px] h-9 text-xs bg-card">
              <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MOCK_OUTLETS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {dateError && <p className="text-xs text-destructive">{dateError}</p>}

      {/* Table */}
      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-[100px]">Order ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Supplier / Source</TableHead>
              <TableHead>Ordered At</TableHead>
              <TableHead className="text-right">Ordered Qty</TableHead>
              <TableHead className="text-right">Received Qty</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Close Type</TableHead>
              <TableHead>Closed At</TableHead>
              <TableHead>Closed By</TableHead>
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
              rows.map((row) => {
                const rate = fulfillmentRate(row.receivedQty, row.orderedQty);
                return (
                  <TableRow key={row.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium text-primary">{row.orderId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TYPE_BADGE[row.supplierType])}>
                        {row.supplierType === "Vendor" ? "PO (Vendor)" : row.supplierType === "Outlet" ? "PO (Outlet)" : "Transfer"}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell className="text-muted-foreground">{row.orderedAt}</TableCell>
                    <TableCell className="text-right">{row.orderedQty}</TableCell>
                    <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
                    <TableCell><FulfillmentBadge rate={rate} /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CLOSE_TYPE_BADGE[row.closeType])}>
                        {row.closeType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.closedAt}</TableCell>
                    <TableCell>{row.closedBy}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-xs h-7"
                        onClick={() => navigate(`/procurements/closed-orders/${row.id}`, { state: { order: row } })}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
