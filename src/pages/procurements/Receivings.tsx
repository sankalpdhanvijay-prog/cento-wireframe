import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronDown, ChevronRight, MapPin, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ─── Mock Data ─── */
const MOCK_OUTLETS = [
  { id: "all", name: "All Outlets" },
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
];

export type OrderType = "Vendor" | "Outlet" | "Transfer";

export interface ReceivingEntry {
  id: string;
  requisitionId: string; // GDN ID or PO ID
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
  {
    id: "or1", orderId: "PO-1005", orderType: "Vendor", supplier: "Sysco Foods", outlet: "Main Kitchen",
    orderedAt: "2026-01-20", expectedDelivery: "2026-02-01", orderedQty: 310, receivedQty: 180, pendingQty: 130, orderAmount: 44800,
    receivings: [
      { id: "re1", requisitionId: "PO-1005", receivingQty: 100, orderAmount: 14400, invoiceAmount: 14200, creationDate: "2026-01-25", createdBy: "Ankit", receivingDate: "2026-01-28" },
      { id: "re2", requisitionId: "PO-1005", receivingQty: 80, orderAmount: 11520, invoiceAmount: 11520, creationDate: "2026-01-30", createdBy: "Meera", receivingDate: null },
    ],
  },
  {
    id: "or2", orderId: "PO-1007", orderType: "Vendor", supplier: "US Foods", outlet: "Main Kitchen",
    orderedAt: "2026-01-10", expectedDelivery: "2026-02-05", orderedQty: 250, receivedQty: 180, pendingQty: 70, orderAmount: 42560,
    receivings: [
      { id: "re3", requisitionId: "PO-1007", receivingQty: 180, orderAmount: 30643, invoiceAmount: 30500, creationDate: "2026-02-01", createdBy: "Raj", receivingDate: "2026-02-03" },
    ],
  },
  {
    id: "or3", orderId: "PO-1008", orderType: "Outlet", supplier: "Fresh Direct", outlet: "Central Warehouse",
    orderedAt: "2026-01-08", expectedDelivery: "2026-02-03", orderedQty: 100, receivedQty: 0, pendingQty: 100, orderAmount: 15000,
    receivings: [],
  },
  {
    id: "or4", orderId: "TO-2005", orderType: "Transfer", supplier: "Main Kitchen", outlet: "Central Warehouse",
    orderedAt: "2026-01-28", expectedDelivery: "2026-02-05", orderedQty: 100, receivedQty: 0, pendingQty: 100, orderAmount: 18000,
    receivings: [],
  },
  {
    id: "or5", orderId: "PO-1003", orderType: "Vendor", supplier: "Metro Supply", outlet: "Main Kitchen",
    orderedAt: "2026-01-28", expectedDelivery: "2026-02-08", orderedQty: 200, receivedQty: 200, pendingQty: 0, orderAmount: 33490,
    receivings: [
      { id: "re4", requisitionId: "PO-1003", receivingQty: 200, orderAmount: 33490, invoiceAmount: 33490, creationDate: "2026-02-06", createdBy: "Ankit", receivingDate: "2026-02-08" },
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
  Vendor: "bg-blue-50 text-blue-700",
  Outlet: "bg-purple-50 text-purple-700",
  Transfer: "bg-teal-50 text-teal-700",
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

  // Filter orders
  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((o) => {
      // Open/Partial = pendingQty > 0
      if (tab === "open" && o.pendingQty <= 0) return false;
      if (tab === "closed" && o.pendingQty > 0) return false;
      if (outlet !== "all" && o.outlet !== MOCK_OUTLETS.find((x) => x.id === outlet)?.name) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.orderId.toLowerCase().includes(q) && !o.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tab, outlet, search]);

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
        if (!r.grnId.toLowerCase().includes(q) && !r.supplier.toLowerCase().includes(q) && !r.requisitionId.toLowerCase().includes(q)) return false;
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
          <OpenPartialTable orders={filteredOrders} expanded={expanded} toggle={toggle} navigate={navigate} readOnly={false} />
        </TabsContent>

        {/* Fulfilled Tab */}
        <TabsContent value="fulfilled" className="mt-0">
          <FulfilledTable rows={filteredFulfilled} onClose={handleClose} navigate={navigate} />
        </TabsContent>

        {/* Closed Tab */}
        <TabsContent value="closed" className="mt-0">
          <ClosedTable orders={MOCK_ORDERS.filter((o) => o.pendingQty <= 0)} closedFulfilled={filteredClosed} navigate={navigate} search={search} outlet={outlet} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ─── Open / Partial Table ─── */
function OpenPartialTable({ orders, expanded, toggle, navigate, readOnly }: {
  orders: OrderRow[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  readOnly: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableBody>
            <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">No orders found.</TableCell></TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="cento-card p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-10" />
            <TableHead>Order ID</TableHead>
            <TableHead>Order Type</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Ordered At</TableHead>
            <TableHead>Expected Delivery</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead className="text-right">Pending Qty</TableHead>
            <TableHead className="text-right">Order Amount</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isOpen = expanded[order.id] ?? false;
            const hasReceivings = order.receivings.length > 0;
            return (
              <>
                <TableRow key={order.id} className="hover:bg-muted/20">
                  <TableCell className="px-2">
                    {hasReceivings && (
                      <button onClick={() => toggle(order.id)} className="p-1 hover:bg-muted rounded transition-colors">
                        {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-primary">{order.orderId}</TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", TYPE_BADGE[order.orderType])}>
                      {order.orderType}
                    </span>
                  </TableCell>
                  <TableCell>{order.supplier}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(order.orderedAt), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(order.expectedDelivery), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right">{order.orderedQty}</TableCell>
                  <TableCell className="text-right text-emerald-700">{order.receivedQty}</TableCell>
                  <TableCell className="text-right text-amber-600 font-medium">{order.pendingQty}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(order.orderAmount)}</TableCell>
                  <TableCell>
                    {readOnly ? (
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/receiving/view/${order.id}`)}>
                        <Eye className="h-3 w-3 mr-1" /> View
                      </Button>
                    ) : hasReceivings ? (
                      <button onClick={() => toggle(order.id)} className="text-lg">⬇️</button>
                    ) : (
                      <Button variant="cento" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/receiving/receive/${order.id}`)}>
                        Receive
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {isOpen && hasReceivings && order.receivings.map((entry, idx) => {
                  const isLatest = idx === order.receivings.length - 1;
                  return (
                    <TableRow key={entry.id} className="bg-muted/10 border-l-2 border-l-primary/20">
                      <TableCell />
                      <TableCell className="font-medium text-muted-foreground pl-6">{entry.requisitionId}</TableCell>
                      <TableCell colSpan={2} />
                      <TableCell className="text-muted-foreground">{format(new Date(entry.creationDate), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.receivingDate ? format(new Date(entry.receivingDate), "dd MMM yyyy") : "—"}</TableCell>
                      <TableCell className="text-right">{entry.receivingQty}</TableCell>
                      <TableCell className="text-right">{fmt(entry.orderAmount)}</TableCell>
                      <TableCell className="text-right">{fmt(entry.invoiceAmount)}</TableCell>
                      <TableCell className="text-muted-foreground">{entry.createdBy}</TableCell>
                      <TableCell>
                        {readOnly ? (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/receiving/view/${order.id}?entry=${entry.id}`)}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        ) : isLatest ? (
                          <Button variant="cento" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/receiving/receive/${order.id}?entry=${entry.id}`)}>
                            Receive
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate(`/procurements/receiving/view/${order.id}?entry=${entry.id}`)}>
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </>
            );
          })}
        </TableBody>
      </Table>
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

/* ─── Closed Table (same as Open/Partial but view-only) ─── */
function ClosedTable({ orders, closedFulfilled, navigate, search, outlet }: {
  orders: OrderRow[];
  closedFulfilled: FulfilledRow[];
  navigate: ReturnType<typeof useNavigate>;
  search: string;
  outlet: string;
}) {
  // Combine original fully-received orders with closed-from-fulfilled
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (outlet !== "all" && o.outlet !== MOCK_OUTLETS.find((x) => x.id === outlet)?.name) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.orderId.toLowerCase().includes(q) && !o.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, search, outlet]);

  // Show the closed fulfilled entries as a simple table too
  return (
    <div className="space-y-4">
      <OpenPartialTable orders={filteredOrders} expanded={expanded} toggle={toggle} navigate={navigate} readOnly={true} />
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
