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
import { usePOStore, type POStatus } from "@/context/POStoreContext";

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
  const { getOrder, updateOrderStatus } = usePOStore();

  const po = id ? getOrder(id) : undefined;

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
        updateOrderStatus(po.id, "Raised");
        navigate("/procurements/all-orders");
        break;
      case "approve":
        updateOrderStatus(po.id, "Approved");
        navigate("/procurements/all-orders");
        break;
      case "receive":
        navigate("/procurements/new-receiving/po", { state: { poId: po.id } });
        break;
      case "receive-more":
        navigate("/procurements/new-receiving/po", { state: { poId: po.id } });
        break;
      case "close":
        updateOrderStatus(po.id, "Closed");
        navigate("/procurements/all-orders");
        break;
      case "cancel":
        updateOrderStatus(po.id, "Cancelled");
        navigate("/procurements/all-orders");
        break;
    }
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate("/procurements/all-orders")}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to Orders
      </Button>

      {/* SECTION 1: PO Details */}
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

      {/* SECTION 2: Materials Details */}
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
          <div className="flex items-center gap-6 px-4 py-3 bg-muted/20 border-t text-xs">
            <span className="text-muted-foreground">Total Ordered: <span className="font-semibold text-foreground">{totalOrderedQty}</span></span>
            <span className="text-muted-foreground">Total Received: <span className="font-semibold text-emerald-700">{totalReceivedQty}</span></span>
            <span className="text-muted-foreground">Total Pending: <span className="font-semibold text-amber-600">{totalPendingQty}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Financial Summary */}
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

      {/* Sticky Footer CTAs */}
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
