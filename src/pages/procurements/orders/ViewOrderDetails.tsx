import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Lock,
} from "lucide-react";

/* ───── types ───── */
type POStatus = "Drafted" | "Raised" | "Approved" | "Partially Received" | "Closed" | "Cancelled";

interface MaterialLine {
  name: string;
  orderedQty: number;
  unitPrice: number;
  taxPct: number;
  lineTotal: number;
  receivedQty: number;
  pendingQty: number;
}

interface PODetail {
  id: string;
  vendor: string;
  outlet: string;
  createdBy: string;
  createdOn: string;
  status: POStatus;
  expectedDelivery?: string;
  lastUpdated?: string;
  closedBy?: string;
  closedDate?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  materials: MaterialLine[];
  poSubtotal: number;
  totalTax: number;
  grandTotal: number;
  invoiceValueReceived?: number;
  invoiceTaxReceived?: number;
  outstandingValue?: number;
}

/* ───── mock lookup ───── */
const MOCK_DETAILS: Record<string, PODetail> = {
  "PO-1001": {
    id: "PO-1001", vendor: "Sysco Foods", outlet: "Main Kitchen",
    createdBy: "Ankit", createdOn: "2026-02-01", status: "Drafted",
    expectedDelivery: "2026-02-10", lastUpdated: "2026-02-02",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 50, unitPrice: 220, taxPct: 5, lineTotal: 11000, receivedQty: 0, pendingQty: 50 },
      { name: "Sunflower Oil 15L", orderedQty: 30, unitPrice: 350, taxPct: 12, lineTotal: 10500, receivedQty: 0, pendingQty: 30 },
      { name: "Wheat Flour 50kg", orderedQty: 40, unitPrice: 75, taxPct: 5, lineTotal: 3000, receivedQty: 0, pendingQty: 40 },
    ],
    poSubtotal: 24500, totalTax: 1765, grandTotal: 26265,
  },
  "PO-1002": {
    id: "PO-1002", vendor: "US Foods", outlet: "Central Warehouse",
    createdBy: "Meera", createdOn: "2026-02-03", status: "Drafted",
    lastUpdated: "2026-02-04",
    materials: [
      { name: "Olive Oil 5L", orderedQty: 25, unitPrice: 480, taxPct: 12, lineTotal: 12000, receivedQty: 0, pendingQty: 25 },
      { name: "Black Pepper 1kg", orderedQty: 60, unitPrice: 103.33, taxPct: 5, lineTotal: 6200, receivedQty: 0, pendingQty: 60 },
    ],
    poSubtotal: 18200, totalTax: 1750, grandTotal: 19950,
  },
  "PO-1003": {
    id: "PO-1003", vendor: "Metro Supply", outlet: "Main Kitchen",
    createdBy: "Ankit", createdOn: "2026-01-28", status: "Raised",
    expectedDelivery: "2026-02-08",
    materials: [
      { name: "Tomato Paste 5kg", orderedQty: 80, unitPrice: 150, taxPct: 12, lineTotal: 12000, receivedQty: 0, pendingQty: 80 },
      { name: "Chickpeas 25kg", orderedQty: 60, unitPrice: 180, taxPct: 5, lineTotal: 10800, receivedQty: 0, pendingQty: 60 },
      { name: "Salt 50kg", orderedQty: 60, unitPrice: 136.67, taxPct: 5, lineTotal: 8200, receivedQty: 0, pendingQty: 60 },
    ],
    poSubtotal: 31000, totalTax: 2490, grandTotal: 33490,
  },
  "PO-1004": {
    id: "PO-1004", vendor: "Fresh Direct", outlet: "Central Warehouse",
    createdBy: "Meera", createdOn: "2026-01-25", status: "Raised",
    materials: [
      { name: "Fresh Tomatoes 10kg", orderedQty: 30, unitPrice: 250, taxPct: 0, lineTotal: 7500, receivedQty: 0, pendingQty: 30 },
      { name: "Onions 25kg", orderedQty: 30, unitPrice: 175, taxPct: 0, lineTotal: 5250, receivedQty: 0, pendingQty: 30 },
    ],
    poSubtotal: 12750, totalTax: 0, grandTotal: 12750,
  },
  "PO-1005": {
    id: "PO-1005", vendor: "Sysco Foods", outlet: "Main Kitchen",
    createdBy: "Raj", createdOn: "2026-01-20", status: "Approved",
    expectedDelivery: "2026-02-01",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 100, unitPrice: 220, taxPct: 5, lineTotal: 22000, receivedQty: 0, pendingQty: 100 },
      { name: "Sugar 50kg", orderedQty: 80, unitPrice: 125, taxPct: 5, lineTotal: 10000, receivedQty: 0, pendingQty: 80 },
      { name: "Turmeric Powder 5kg", orderedQty: 130, unitPrice: 76.92, taxPct: 12, lineTotal: 10000, receivedQty: 0, pendingQty: 130 },
    ],
    poSubtotal: 42000, totalTax: 2800, grandTotal: 44800,
  },
  "PO-1006": {
    id: "PO-1006", vendor: "Metro Supply", outlet: "South Outlet",
    createdBy: "Ankit", createdOn: "2026-01-18", status: "Approved",
    materials: [
      { name: "Coriander Powder 1kg", orderedQty: 55, unitPrice: 172.73, taxPct: 5, lineTotal: 9500, receivedQty: 0, pendingQty: 55 },
    ],
    poSubtotal: 9500, totalTax: 475, grandTotal: 9975,
  },
  "PO-1007": {
    id: "PO-1007", vendor: "US Foods", outlet: "Main Kitchen",
    createdBy: "Meera", createdOn: "2026-01-10", status: "Partially Received",
    lastUpdated: "2026-02-05",
    materials: [
      { name: "Pasta 5kg", orderedQty: 100, unitPrice: 180, taxPct: 12, lineTotal: 18000, receivedQty: 80, pendingQty: 20 },
      { name: "Cheese Block 5kg", orderedQty: 80, unitPrice: 150, taxPct: 12, lineTotal: 12000, receivedQty: 60, pendingQty: 20 },
      { name: "Cream 5L", orderedQty: 70, unitPrice: 114.29, taxPct: 12, lineTotal: 8000, receivedQty: 40, pendingQty: 30 },
    ],
    poSubtotal: 38000, totalTax: 4560, grandTotal: 42560,
    invoiceValueReceived: 27600, invoiceTaxReceived: 3312, outstandingValue: 11688,
  },
  "PO-1008": {
    id: "PO-1008", vendor: "Fresh Direct", outlet: "Central Warehouse",
    createdBy: "Raj", createdOn: "2026-01-08", status: "Partially Received",
    materials: [
      { name: "Fresh Spinach 5kg", orderedQty: 50, unitPrice: 160, taxPct: 0, lineTotal: 8000, receivedQty: 30, pendingQty: 20 },
      { name: "Carrots 10kg", orderedQty: 50, unitPrice: 140, taxPct: 0, lineTotal: 7000, receivedQty: 30, pendingQty: 20 },
    ],
    poSubtotal: 15000, totalTax: 0, grandTotal: 15000,
    invoiceValueReceived: 9000, invoiceTaxReceived: 0, outstandingValue: 6000,
  },
  "PO-1009": {
    id: "PO-1009", vendor: "Sysco Foods", outlet: "Main Kitchen",
    createdBy: "Ankit", createdOn: "2025-12-20", status: "Closed",
    closedDate: "2026-01-15", closedBy: "Meera",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 80, unitPrice: 220, taxPct: 5, lineTotal: 17600, receivedQty: 80, pendingQty: 0 },
      { name: "Lentils 25kg", orderedQty: 70, unitPrice: 141.43, taxPct: 5, lineTotal: 9900, receivedQty: 70, pendingQty: 0 },
    ],
    poSubtotal: 27500, totalTax: 1375, grandTotal: 28875,
    invoiceValueReceived: 27500, invoiceTaxReceived: 1375, outstandingValue: 0,
  },
  "PO-1010": {
    id: "PO-1010", vendor: "Metro Supply", outlet: "South Outlet",
    createdBy: "Raj", createdOn: "2025-12-15", status: "Closed",
    closedDate: "2026-01-10", closedBy: "Ankit",
    materials: [
      { name: "Red Chilli Powder 1kg", orderedQty: 75, unitPrice: 149.33, taxPct: 5, lineTotal: 11200, receivedQty: 75, pendingQty: 0 },
    ],
    poSubtotal: 11200, totalTax: 560, grandTotal: 11760,
    invoiceValueReceived: 11200, invoiceTaxReceived: 560, outstandingValue: 0,
  },
  "PO-1011": {
    id: "PO-1011", vendor: "US Foods", outlet: "Central Warehouse",
    createdBy: "Meera", createdOn: "2025-12-10", status: "Cancelled",
    cancelledDate: "2025-12-12", cancelledBy: "Ankit",
    materials: [
      { name: "Soy Sauce 1L", orderedQty: 40, unitPrice: 222.5, taxPct: 12, lineTotal: 8900, receivedQty: 0, pendingQty: 40 },
    ],
    poSubtotal: 8900, totalTax: 1068, grandTotal: 9968,
  },
  "PO-1012": {
    id: "PO-1012", vendor: "Fresh Direct", outlet: "Main Kitchen",
    createdBy: "Raj", createdOn: "2025-12-05", status: "Cancelled",
    cancelledDate: "2025-12-06", cancelledBy: "Meera",
    materials: [
      { name: "Bell Peppers 5kg", orderedQty: 30, unitPrice: 206.67, taxPct: 0, lineTotal: 6200, receivedQty: 0, pendingQty: 30 },
    ],
    poSubtotal: 6200, totalTax: 0, grandTotal: 6200,
  },
};

const STATUS_COLOR: Record<POStatus, string> = {
  Drafted: "bg-muted text-muted-foreground",
  Raised: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  "Partially Received": "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-neutral-100 text-neutral-600 border-neutral-300",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ViewOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const po = id ? MOCK_DETAILS[id] : undefined;

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Order not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/procurements/all-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Button>
      </div>
    );
  }

  const isReadOnly = po.status === "Closed" || po.status === "Cancelled";
  const showReceivingTotals = po.status === "Partially Received" || po.status === "Closed";

  const totalOrderedQty = po.materials.reduce((s, m) => s + m.orderedQty, 0);
  const totalReceivedQty = po.materials.reduce((s, m) => s + m.receivedQty, 0);
  const totalPendingQty = po.materials.reduce((s, m) => s + m.pendingQty, 0);

  const handleAction = (action: string) => {
    switch (action) {
      case "submit":
        // Change to Raised
        navigate("/procurements/all-orders");
        break;
      case "approve":
        // Change to Approved
        navigate("/procurements/all-orders");
        break;
      case "receive":
        navigate("/procurements/new-receiving/po", { state: { poId: po.id } });
        break;
      case "receive-more":
        navigate("/procurements/new-receiving/po", { state: { poId: po.id } });
        break;
      case "close":
        navigate("/procurements/all-orders");
        break;
      case "cancel":
        navigate("/procurements/all-orders");
        break;
    }
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      {/* Back nav */}
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate("/procurements/all-orders")}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Orders
      </Button>

      {/* ─── SECTION 1: PO Details ─── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">PO Details</CardTitle>
            <Badge variant="outline" className={`text-xs px-3 py-1 ${STATUS_COLOR[po.status]}`}>
              {po.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <DetailField label="PO ID" value={po.id} highlight />
            <DetailField label="Vendor" value={po.vendor} />
            <DetailField label="Outlet" value={po.outlet} />
            <DetailField label="Created By" value={po.createdBy} />
            <DetailField label="Created On" value={po.createdOn} />
            <DetailField label="Status" value={po.status} />
            {po.expectedDelivery && <DetailField label="Expected Delivery" value={po.expectedDelivery} />}
            {po.lastUpdated && <DetailField label="Last Updated" value={po.lastUpdated} />}
            {po.closedBy && <DetailField label="Closed By" value={po.closedBy} />}
            {po.closedDate && <DetailField label="Closed Date" value={po.closedDate} />}
            {po.cancelledBy && <DetailField label="Cancelled By" value={po.cancelledBy} />}
            {po.cancelledDate && <DetailField label="Cancelled Date" value={po.cancelledDate} />}
          </div>
        </CardContent>
      </Card>

      {/* ─── SECTION 2: Materials Details ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Materials Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead className="text-right">Line Total</TableHead>
                <TableHead className="text-right">Received Qty</TableHead>
                <TableHead className="text-right">Pending Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.materials.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.orderedQty}</TableCell>
                  <TableCell className="text-right">{fmt(m.unitPrice)}</TableCell>
                  <TableCell className="text-right">{m.taxPct}%</TableCell>
                  <TableCell className="text-right font-medium">{fmt(m.lineTotal)}</TableCell>
                  <TableCell className="text-right text-emerald-700">{m.receivedQty}</TableCell>
                  <TableCell className={`text-right ${m.pendingQty > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>{m.pendingQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Quantity summary */}
          <div className="flex items-center gap-6 px-4 py-3 bg-muted/20 border-t text-xs">
            <span className="text-muted-foreground">Total Ordered: <span className="font-semibold text-foreground">{totalOrderedQty}</span></span>
            <span className="text-muted-foreground">Total Received: <span className="font-semibold text-emerald-700">{totalReceivedQty}</span></span>
            <span className="text-muted-foreground">Total Pending: <span className="font-semibold text-amber-600">{totalPendingQty}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* ─── SECTION 3: Financial Summary ─── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <SummaryRow label="PO Subtotal" value={fmt(po.poSubtotal)} />
            <SummaryRow label="Total Tax" value={fmt(po.totalTax)} />
            <Separator />
            <SummaryRow label="Grand Total" value={fmt(po.grandTotal)} bold />

            {showReceivingTotals && (
              <>
                <div className="h-3" />
                <SummaryRow label="Total Invoice Value Received" value={fmt(po.invoiceValueReceived ?? 0)} accent />
                <SummaryRow label="Total Tax Received" value={fmt(po.invoiceTaxReceived ?? 0)} />
                <Separator />
                <SummaryRow label="Outstanding Value" value={fmt(po.outstandingValue ?? 0)} bold />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Sticky Footer CTAs ─── */}
      {!isReadOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
          <div className="max-w-[1000px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
            {po.status === "Drafted" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel PO
                </Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("submit")}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Submit PO
                </Button>
              </>
            )}
            {po.status === "Raised" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel PO
                </Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("approve")}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve PO
                </Button>
              </>
            )}
            {po.status === "Approved" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel PO
                </Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("receive")}>
                  <Package className="h-3.5 w-3.5 mr-1" /> Receive PO
                </Button>
              </>
            )}
            {po.status === "Partially Received" && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleAction("close")}>
                  <Lock className="h-3.5 w-3.5 mr-1" /> Close PO
                </Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("receive-more")}>
                  <Package className="h-3.5 w-3.5 mr-1" /> Receive More
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── helpers ───── */
function DetailField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? "font-semibold text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-lg" : ""} ${accent ? "text-emerald-700" : ""}`}>{value}</span>
    </div>
  );
}
