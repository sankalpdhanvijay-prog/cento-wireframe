import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Plus,
  Search,
  CalendarIcon,
  PackageCheck,
  Filter,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
];

const MOCK_VENDORS = [
  { id: "v1", name: "Fresh Farms Pvt Ltd" },
  { id: "v2", name: "Spice World Traders" },
  { id: "v3", name: "Daily Dairy Supplies" },
];

interface ReceivingRow {
  id: string;
  receivingId: string;
  poNumber?: string;
  vendor: string;
  outlet: string;
  date: string;
  type: "PO Based" | "Direct";
  status: "Submitted" | "Draft";
  totalQty: number;
  grandTotal: number;
  itemCount: number;
}

const MOCK_RECEIVINGS: ReceivingRow[] = [
  { id: "1", receivingId: "RCV-2026-001", poNumber: "PO-2026-045", vendor: "Fresh Farms Pvt Ltd", outlet: "Main Kitchen", date: "2026-02-10", type: "PO Based", status: "Submitted", totalQty: 150, grandTotal: 32500, itemCount: 5 },
  { id: "2", receivingId: "RCV-2026-002", vendor: "Spice World Traders", outlet: "Main Kitchen", date: "2026-02-09", type: "Direct", status: "Submitted", totalQty: 45, grandTotal: 8750, itemCount: 3 },
  { id: "3", receivingId: "RCV-2026-003", poNumber: "PO-2026-038", vendor: "Daily Dairy Supplies", outlet: "Branch - Indiranagar", date: "2026-02-08", type: "PO Based", status: "Draft", totalQty: 80, grandTotal: 28800, itemCount: 4 },
  { id: "4", receivingId: "RCV-2026-004", vendor: "Fresh Farms Pvt Ltd", outlet: "Branch - Koramangala", date: "2026-02-07", type: "Direct", status: "Draft", totalQty: 30, grandTotal: 4200, itemCount: 2 },
  { id: "5", receivingId: "RCV-2026-005", poNumber: "PO-2026-050", vendor: "Daily Dairy Supplies", outlet: "Main Kitchen", date: "2026-02-11", type: "PO Based", status: "Submitted", totalQty: 200, grandTotal: 54000, itemCount: 7 },
];

export default function ReceivingLanding() {
  const navigate = useNavigate();
  const isAdmin = true;
  const [tab, setTab] = useState("po");
  const [outlet, setOutlet] = useState("all");
  const [vendor, setVendor] = useState("all");
  const [status, setStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filtered = useMemo(() => {
    const typeFilter = tab === "po" ? "PO Based" : "Direct";
    return MOCK_RECEIVINGS.filter((r) => {
      if (r.type !== typeFilter) return false;
      if (outlet !== "all" && r.outlet !== outlet) return false;
      if (vendor !== "all" && r.vendor !== vendor) return false;
      if (status !== "all" && r.status !== status) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !r.receivingId.toLowerCase().includes(q) &&
          !(r.poNumber || "").toLowerCase().includes(q) &&
          !r.vendor.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [tab, outlet, vendor, status, searchQuery]);

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="cento-page-title text-xl">Receivings</h2>
        <Button
          variant="cento"
          onClick={() => navigate("/procurements/new-receiving/create")}
        >
          <Plus className="h-4 w-4" />
          Raise Receiving
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="po" className="data-[state=active]:shadow-sm">
            From Purchase Order
          </TabsTrigger>
          <TabsTrigger value="direct" className="data-[state=active]:shadow-sm">
            From Direct Receiving
          </TabsTrigger>
        </TabsList>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Select value={outlet} onValueChange={setOutlet} disabled={!isAdmin}>
            <SelectTrigger className="w-[170px] h-9 text-xs bg-card">
              <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
              <SelectValue placeholder="All Outlets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {MOCK_OUTLETS.map((o) => (
                <SelectItem key={o.id} value={o.name}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border" />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs bg-card font-normal">
                <CalendarIcon className="h-3 w-3 mr-1" />
                {dateFrom ? format(dateFrom, "dd MMM") : "From"} – {dateTo ? format(dateTo, "dd MMM") : "To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-border" />

          <Select value={vendor} onValueChange={setVendor}>
            <SelectTrigger className="w-[170px] h-9 text-xs bg-card">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              {MOCK_VENDORS.map((v) => (
                <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="w-px h-6 bg-border" />

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] h-9 text-xs bg-card">
              <Filter className="h-3 w-3 text-muted-foreground mr-1" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Submitted">Submitted</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <div className="relative w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, PO, or vendor..."
              className="pl-8 h-9 text-xs bg-card"
            />
          </div>
        </div>

        <TabsContent value="po" className="mt-0">
          <ReceivingList rows={filtered} isPO onRowClick={(row) => navigate(row.status === "Draft" ? `/procurements/new-receiving/edit/${row.id}` : `/procurements/new-receiving/view/${row.id}`)} />
        </TabsContent>
        <TabsContent value="direct" className="mt-0">
          <ReceivingList rows={filtered} isPO={false} onRowClick={(row) => navigate(row.status === "Draft" ? `/procurements/new-receiving/edit/${row.id}` : `/procurements/new-receiving/view/${row.id}`)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReceivingList({ rows, isPO, onRowClick }: { rows: ReceivingRow[]; isPO: boolean; onRowClick: (row: ReceivingRow) => void }) {
  if (rows.length === 0) {
    return (
      <div className="cento-card mt-3">
        <div className="cento-empty-state py-16">
          <div className="h-12 w-12 rounded-xl bg-cento-yellow-tint flex items-center justify-center mb-4">
            <PackageCheck className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-foreground">No receivings found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Start by raising a new receiving to log incoming deliveries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cento-card mt-3 !p-0 overflow-hidden">
      <div className={cn(
        "grid gap-3 px-4 py-2.5 bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider",
        isPO
          ? "grid-cols-[1fr_1fr_1fr_100px_90px_100px_80px]"
          : "grid-cols-[1fr_1fr_1fr_100px_100px_80px]"
      )}>
        <span>Receiving ID</span>
        <span>Vendor</span>
        <span>Outlet</span>
        <span>Date</span>
        {isPO && <span className="text-right">Qty</span>}
        <span className="text-right">Total</span>
        <span className="text-right">Status</span>
      </div>
      {rows.map((row) => (
        <div
          key={row.id}
          onClick={() => onRowClick(row)}
          className={cn(
            "grid gap-3 px-4 py-3.5 border-b border-border/40 cursor-pointer hover:bg-muted/30 transition-colors",
            isPO
              ? "grid-cols-[1fr_1fr_1fr_100px_90px_100px_80px]"
              : "grid-cols-[1fr_1fr_1fr_100px_100px_80px]"
          )}
        >
          <div>
            <span className="text-sm font-medium text-foreground">{row.receivingId}</span>
            {row.poNumber && (
              <span className="text-xs text-muted-foreground ml-2">→ {row.poNumber}</span>
            )}
          </div>
          <span className="text-sm text-foreground truncate">{row.vendor}</span>
          <span className="text-sm text-muted-foreground truncate">{row.outlet}</span>
          <span className="text-sm text-muted-foreground">{format(new Date(row.date), "dd MMM")}</span>
          {isPO && <span className="text-sm text-foreground text-right font-medium">{row.totalQty}</span>}
          <span className="text-sm text-foreground text-right font-medium">₹{row.grandTotal.toLocaleString("en-IN")}</span>
          <div className="flex justify-end">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-medium px-2 py-0.5",
                row.status === "Submitted"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              )}
            >
              {row.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
