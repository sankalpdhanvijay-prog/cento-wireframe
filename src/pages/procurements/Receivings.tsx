import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronDown, ChevronRight, MapPin, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/* ─── Mock Data ─── */
const MOCK_OUTLETS = [
  { id: "all", name: "All Outlets" },
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

export type OrderType = "Vendor" | "Outlet" | "Transfer";

export interface ReceivingEntry {
  id: string;
  requisitionId: string; // GDN ID or PO ID
  receivingId: string | null; // GRN ID or null
  receivingQty: number;
  orderAmount: number;
  invoiceAmount: number;
  creationDate: string;
  createdBy: string;
  receivingDate: string | null;
}

export interface OrderRow {
  id: string;
  orderId: string; // PO ID or TO ID
  orderType: OrderType;
  supplier: string;
  outlet: string;
  orderedAt: string;
  expectedDelivery: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  orderAmount: number;
  receivings: ReceivingEntry[];
}

export interface FulfilledRow {
  id: string;
  grnId: string;
  supplier: string;
  requisitionId: string;
  dispatchId: string;
  receivedBy: string;
  receivedOn: string;
  amount: number;
}

const MOCK_ORDERS: OrderRow[] = [
  // 1) PO Vendor, no receivings
  {
    id: "or1", orderId: "PO-1010", orderType: "Vendor", supplier: "Sysco Foods", outlet: "Main Kitchen",
    orderedAt: "2026-02-15", expectedDelivery: "2026-02-25", orderedQty: 200, receivedQty: 0, pendingQty: 200, orderAmount: 38000,
    receivings: [],
  },
  // 2) PO Vendor, 3 receivings, 60% pending
  {
    id: "or2", orderId: "PO-1005", orderType: "Vendor", supplier: "US Foods", outlet: "Main Kitchen",
    orderedAt: "2026-01-20", expectedDelivery: "2026-02-01", orderedQty: 500, receivedQty: 200, pendingQty: 300, orderAmount: 72000,
    receivings: [
      { id: "re1", requisitionId: "PO-1005", receivingId: "GRN-2026-010", receivingQty: 80, orderAmount: 11520, invoiceAmount: 11400, creationDate: "2026-01-25", createdBy: "Ankit", receivingDate: "2026-01-28" },
      { id: "re2", requisitionId: "PO-1005", receivingId: "GRN-2026-011", receivingQty: 70, orderAmount: 10080, invoiceAmount: 10080, creationDate: "2026-01-30", createdBy: "Meera", receivingDate: "2026-02-01" },
      { id: "re3", requisitionId: "PO-1005", receivingId: null, receivingQty: 50, orderAmount: 7200, invoiceAmount: 7200, creationDate: "2026-02-05", createdBy: "Raj", receivingDate: null },
    ],
  },
  // 3) PO Outlet, 2 dispatches with GRN + 1 most recent GDN without GRN
  {
    id: "or3", orderId: "PO-1008", orderType: "Outlet", supplier: "Fresh Direct", outlet: "Central Warehouse",
    orderedAt: "2026-01-08", expectedDelivery: "2026-02-03", orderedQty: 150, receivedQty: 90, pendingQty: 60, orderAmount: 22500,
    receivings: [
      { id: "re4", requisitionId: "GDN-3010", receivingId: "GRN-2026-020", receivingQty: 50, orderAmount: 7500, invoiceAmount: 7400, creationDate: "2026-01-15", createdBy: "Ankit", receivingDate: "2026-01-18" },
      { id: "re5", requisitionId: "GDN-3011", receivingId: "GRN-2026-021", receivingQty: 40, orderAmount: 6000, invoiceAmount: 5900, creationDate: "2026-01-22", createdBy: "Meera", receivingDate: "2026-01-25" },
      { id: "re6", requisitionId: "GDN-3012", receivingId: null, receivingQty: 0, orderAmount: 0, invoiceAmount: 0, creationDate: "2026-02-01", createdBy: "Raj", receivingDate: null },
    ],
  },
  // 4) TO, similar to 3 but Transfer type
  {
    id: "or4", orderId: "TO-2005", orderType: "Transfer", supplier: "Main Kitchen", outlet: "Central Warehouse",
    orderedAt: "2026-01-28", expectedDelivery: "2026-02-05", orderedQty: 100, receivedQty: 60, pendingQty: 40, orderAmount: 18000,
    receivings: [
      { id: "re7", requisitionId: "GDN-3020", receivingId: "GRN-2026-030", receivingQty: 35, orderAmount: 6300, invoiceAmount: 6200, creationDate: "2026-01-30", createdBy: "Ankit", receivingDate: "2026-02-01" },
      { id: "re8", requisitionId: "GDN-3021", receivingId: "GRN-2026-031", receivingQty: 25, orderAmount: 4500, invoiceAmount: 4500, creationDate: "2026-02-02", createdBy: "Meera", receivingDate: "2026-02-03" },
      { id: "re9", requisitionId: "GDN-3022", receivingId: null, receivingQty: 0, orderAmount: 0, invoiceAmount: 0, creationDate: "2026-02-04", createdBy: "Raj", receivingDate: null },
    ],
  },
  // 5) Fully received order (for Closed tab)
  {
    id: "or5", orderId: "PO-1003", orderType: "Vendor", supplier: "Metro Supply", outlet: "Main Kitchen",
    orderedAt: "2026-01-28", expectedDelivery: "2026-02-08", orderedQty: 200, receivedQty: 200, pendingQty: 0, orderAmount: 33490,
    receivings: [
      { id: "re10", requisitionId: "PO-1003", receivingId: "GRN-2026-040", receivingQty: 200, orderAmount: 33490, invoiceAmount: 33490, creationDate: "2026-02-06", createdBy: "Ankit", receivingDate: "2026-02-08" },
    ],
  },
];

const MOCK_FULFILLED: FulfilledRow[] = [
  { id: "f1", grnId: "GRN-2026-001", supplier: "Sysco Foods", requisitionId: "PO-1005", dispatchId: "DSP-001", receivedBy: "Ankit", receivedOn: "2026-01-28", amount: 14200 },
  { id: "f2", grnId: "GRN-2026-003", supplier: "US Foods", requisitionId: "PO-1007", dispatchId: "DSP-003", receivedBy: "Raj", receivedOn: "2026-02-03", amount: 30500 },
  { id: "f3", grnId: "GRN-2026-004", supplier: "Metro Supply", requisitionId: "PO-1003", dispatchId: "DSP-005", receivedBy: "Ankit", receivedOn: "2026-02-08", amount: 33490 },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const TYPE_BADGE: Record<OrderType, string> = {
  Vendor: "bg-blue-50 text-blue-700 border-blue-200",
  Outlet: "bg-purple-50 text-purple-700 border-purple-200",
  Transfer: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function Receivings() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state as { tab?: string } | null)?.tab ?? "open";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [outlet, setOutlet] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [fulfilledRows, setFulfilledRows] = useState(MOCK_FULFILLED);
  const [closedRows, setClosedRows] = useState<FulfilledRow[]>([]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filterOrders = (pendingFilter: "open" | "closed") => {
    return MOCK_ORDERS.filter((o) => {
      if (pendingFilter === "open" && o.pendingQty <= 0) return false;
      if (pendingFilter === "closed" && o.pendingQty > 0) return false;
      if (outlet !== "all" && o.outlet !== MOCK_OUTLETS.find((x) => x.id === outlet)?.name) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.orderId.toLowerCase().includes(q) && !o.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  };

  const openOrders = useMemo(() => filterOrders("open"), [tab, outlet, search]);
  const closedOrders = useMemo(() => filterOrders("closed"), [tab, outlet, search]);

  const filteredFulfilled = useMemo(() => {
    return fulfilledRows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.grnId.toLowerCase().includes(q) && !r.supplier.toLowerCase().includes(q) && !r.requisitionId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [fulfilledRows, search]);

  const filteredClosed = useMemo(() => {
    return closedRows.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (!r.grnId.toLowerCase().includes(q) && !r.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [closedRows, search]);

  const handleClose = (row: FulfilledRow) => {
    setFulfilledRows((prev) => prev.filter((r) => r.id !== row.id));
    setClosedRows((prev) => [row, ...prev]);
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Receivings</h1>
        <Button variant="cento" onClick={() => navigate("/procurements/receiving/direct")}>
          <Plus className="h-4 w-4" /> Direct Receiving
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/60 p-1 h-auto gap-0.5">
            <TabsTrigger value="open" className="text-xs px-3 py-1.5">Open / Partial</TabsTrigger>
            <TabsTrigger value="fulfilled" className="text-xs px-3 py-1.5">Fulfilled</TabsTrigger>
            <TabsTrigger value="closed" className="text-xs px-3 py-1.5">Closed</TabsTrigger>
          </TabsList>

          <Select value={outlet} onValueChange={setOutlet}>
            <SelectTrigger className="w-[180px] h-9 text-xs bg-card">
              <MapPin className="h-3 w-3 text-muted-foreground mr-1" />
              <SelectValue placeholder="All Outlets" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_OUTLETS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 mb-1">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID, supplier..."
              className="pl-8 h-9 text-xs bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Open / Partial Tab */}
        <TabsContent value="open" className="mt-0">
          <OpenPartialSections orders={openOrders} expanded={expanded} toggle={toggle} navigate={navigate} />
        </TabsContent>

        {/* Fulfilled Tab */}
        <TabsContent value="fulfilled" className="mt-0">
          <FulfilledTable rows={filteredFulfilled} onClose={handleClose} navigate={navigate} />
        </TabsContent>

        {/* Closed Tab */}
        <TabsContent value="closed" className="mt-0">
          <ClosedSections orders={closedOrders} closedFulfilled={filteredClosed} navigate={navigate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Open / Partial Sections ─── */
function OpenPartialSections({ orders, expanded, toggle, navigate }: {
  orders: OrderRow[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  if (orders.length === 0) {
    return (
      <div className="cento-card">
        <div className="cento-empty-state py-16">
          <p className="text-sm text-muted-foreground">No open or partial orders found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const isOpen = expanded[order.id] ?? false;
        const hasReceivings = order.receivings.length > 0;
        const receivedPct = order.orderedQty > 0 ? Math.round((order.receivedQty / order.orderedQty) * 100) : 0;

        return (
          <div key={order.id} className="cento-card !p-0 overflow-hidden">
            {/* Section Header */}
            <div
              className="px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => hasReceivings && toggle(order.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-3 mb-3">
                    {hasReceivings && (
                      <span className="text-muted-foreground">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-primary">{order.orderId}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", TYPE_BADGE[order.orderType])}>
                      {order.orderType}
                    </Badge>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-6 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Supplier</span>
                      <span className="font-medium text-foreground">{order.supplier}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Ordered At</span>
                      <span className="font-medium text-foreground">{format(new Date(order.orderedAt), "dd MMM yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Expected Delivery</span>
                      <span className="font-medium text-foreground">{format(new Date(order.expectedDelivery), "dd MMM yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Ordered Qty</span>
                      <span className="font-medium text-foreground">{order.orderedQty}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Received Qty</span>
                      <span className="font-medium text-emerald-700">{order.receivedQty}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Pending Qty</span>
                      <span className="font-semibold text-amber-700">{order.pendingQty}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Order Amount</span>
                      <span className="font-semibold text-foreground">{fmt(order.orderAmount)}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={receivedPct} className="h-2 flex-1 bg-muted" />
                    <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">{receivedPct}% received</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-2 shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-xs h-7"
                    onClick={() => navigate(`/procurements/receiving/view/${order.id}`)}>
                    <Eye className="h-3 w-3 mr-1" /> View Details
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-7"
                    onClick={() => {
                      // Close order → move to closed (in real app)
                    }}>
                    Close
                  </Button>
                  {order.orderType === "Vendor" && (
                    <Button variant="cento" size="sm" className="text-xs h-7"
                      onClick={() => navigate(`/procurements/receiving/receive/${order.id}`)}>
                      Receive
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible receiving table */}
            {isOpen && hasReceivings && (
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="text-[10px]">Requisition ID</TableHead>
                      <TableHead className="text-[10px]">Receiving ID</TableHead>
                      <TableHead className="text-[10px] text-right">Received Qty</TableHead>
                      <TableHead className="text-[10px] text-right">Order Amount</TableHead>
                      <TableHead className="text-[10px] text-right">Invoice Amount</TableHead>
                      <TableHead className="text-[10px]">Creation Date</TableHead>
                      <TableHead className="text-[10px]">Created By</TableHead>
                      <TableHead className="text-[10px]">Receiving Date</TableHead>
                      <TableHead className="text-[10px] w-[90px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.receivings.map((entry, idx) => {
                      const isLatest = idx === order.receivings.length - 1;
                      const hasNoReceiving = !entry.receivingId;
                      return (
                        <TableRow key={entry.id} className="hover:bg-muted/10">
                          <TableCell className="font-medium text-foreground text-xs">{entry.requisitionId}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{entry.receivingId ?? "—"}</TableCell>
                          <TableCell className="text-right text-xs">{entry.receivingQty || "—"}</TableCell>
                          <TableCell className="text-right text-xs">{entry.orderAmount ? fmt(entry.orderAmount) : "—"}</TableCell>
                          <TableCell className="text-right text-xs">{entry.invoiceAmount ? fmt(entry.invoiceAmount) : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(entry.creationDate), "dd MMM yyyy")}</TableCell>
                          <TableCell className="text-xs">{entry.createdBy}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{entry.receivingDate ? format(new Date(entry.receivingDate), "dd MMM yyyy") : "—"}</TableCell>
                          <TableCell>
                            {isLatest && hasNoReceiving ? (
                              <Button variant="cento" size="sm" className="text-[10px] h-6 px-2"
                                onClick={() => navigate(`/procurements/receiving/receive/${order.id}`)}>
                                Receive
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                                onClick={() => navigate(`/procurements/receiving/view/${order.id}?entry=${entry.id}`)}>
                                <Eye className="h-3 w-3 mr-1" /> View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Fulfilled Table ─── */
function FulfilledTable({ rows, onClose, navigate }: {
  rows: FulfilledRow[];
  onClose: (row: FulfilledRow) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="cento-card p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead>GRN ID</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Requisition ID</TableHead>
            <TableHead>Dispatch ID</TableHead>
            <TableHead>Received By</TableHead>
            <TableHead>Received On</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No fulfilled receivings.</TableCell></TableRow>
          ) : rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/20">
              <TableCell className="font-medium text-primary">{row.grnId}</TableCell>
              <TableCell>{row.supplier}</TableCell>
              <TableCell className="text-muted-foreground">{row.requisitionId}</TableCell>
              <TableCell className="text-muted-foreground">{row.dispatchId}</TableCell>
              <TableCell>{row.receivedBy}</TableCell>
              <TableCell className="text-muted-foreground">{format(new Date(row.receivedOn), "dd MMM yyyy")}</TableCell>
              <TableCell className="text-right font-medium">{fmt(row.amount)}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => onClose(row)}>
                  Close
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Closed Sections (read-only view) ─── */
function ClosedSections({ orders, closedFulfilled, navigate }: {
  orders: OrderRow[];
  closedFulfilled: FulfilledRow[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="space-y-4">
      {/* Closed orders as sections */}
      {orders.length === 0 && closedFulfilled.length === 0 && (
        <div className="cento-card">
          <div className="cento-empty-state py-16">
            <p className="text-sm text-muted-foreground">No closed orders yet.</p>
          </div>
        </div>
      )}

      {orders.map((order) => {
        const isOpen = expanded[order.id] ?? false;
        const hasReceivings = order.receivings.length > 0;

        return (
          <div key={order.id} className="cento-card !p-0 overflow-hidden">
            <div className="px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => hasReceivings && toggle(order.id)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    {hasReceivings && (
                      <span className="text-muted-foreground">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-primary">{order.orderId}</span>
                    <Badge variant="outline" className={cn("text-[10px] font-medium px-2 py-0.5", TYPE_BADGE[order.orderType])}>
                      {order.orderType}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                      Closed
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-6 gap-y-2 text-xs">
                    <div><span className="text-muted-foreground block mb-0.5">Supplier</span><span className="font-medium text-foreground">{order.supplier}</span></div>
                    <div><span className="text-muted-foreground block mb-0.5">Ordered At</span><span className="font-medium text-foreground">{format(new Date(order.orderedAt), "dd MMM yyyy")}</span></div>
                    <div><span className="text-muted-foreground block mb-0.5">Expected Delivery</span><span className="font-medium text-foreground">{format(new Date(order.expectedDelivery), "dd MMM yyyy")}</span></div>
                    <div><span className="text-muted-foreground block mb-0.5">Ordered Qty</span><span className="font-medium text-foreground">{order.orderedQty}</span></div>
                    <div><span className="text-muted-foreground block mb-0.5">Received Qty</span><span className="font-medium text-emerald-700">{order.receivedQty}</span></div>
                    <div><span className="text-muted-foreground block mb-0.5">Pending Qty</span><span className="font-medium text-foreground">{order.pendingQty}</span></div>
                    <div><span className="text-muted-foreground block mb-0.5">Order Amount</span><span className="font-semibold text-foreground">{fmt(order.orderAmount)}</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="text-xs h-7"
                    onClick={() => navigate(`/procurements/receiving/view/${order.id}`)}>
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                </div>
              </div>
            </div>

            {isOpen && hasReceivings && (
              <div className="border-t border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                      <TableHead className="text-[10px]">Requisition ID</TableHead>
                      <TableHead className="text-[10px]">Receiving ID</TableHead>
                      <TableHead className="text-[10px] text-right">Received Qty</TableHead>
                      <TableHead className="text-[10px] text-right">Order Amount</TableHead>
                      <TableHead className="text-[10px] text-right">Invoice Amount</TableHead>
                      <TableHead className="text-[10px]">Creation Date</TableHead>
                      <TableHead className="text-[10px]">Created By</TableHead>
                      <TableHead className="text-[10px]">Receiving Date</TableHead>
                      <TableHead className="text-[10px] w-[90px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.receivings.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/10">
                        <TableCell className="font-medium text-foreground text-xs">{entry.requisitionId}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.receivingId ?? "—"}</TableCell>
                        <TableCell className="text-right text-xs">{entry.receivingQty || "—"}</TableCell>
                        <TableCell className="text-right text-xs">{entry.orderAmount ? fmt(entry.orderAmount) : "—"}</TableCell>
                        <TableCell className="text-right text-xs">{entry.invoiceAmount ? fmt(entry.invoiceAmount) : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(entry.creationDate), "dd MMM yyyy")}</TableCell>
                        <TableCell className="text-xs">{entry.createdBy}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.receivingDate ? format(new Date(entry.receivingDate), "dd MMM yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2"
                            onClick={() => navigate(`/procurements/receiving/view/${order.id}?entry=${entry.id}`)}>
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
      })}

      {/* Closed from fulfilled */}
      {closedFulfilled.length > 0 && (
        <div className="cento-card p-0 overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Closed from Fulfilled
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead>GRN ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Requisition ID</TableHead>
                <TableHead>Dispatch ID</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Received On</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[100px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closedFulfilled.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium text-primary">{row.grnId}</TableCell>
                  <TableCell>{row.supplier}</TableCell>
                  <TableCell className="text-muted-foreground">{row.requisitionId}</TableCell>
                  <TableCell className="text-muted-foreground">{row.dispatchId}</TableCell>
                  <TableCell>{row.receivedBy}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(row.receivedOn), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(row.amount)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/receiving/view/${row.id}`)}>
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
