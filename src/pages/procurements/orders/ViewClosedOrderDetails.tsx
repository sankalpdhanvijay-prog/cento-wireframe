import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClosedOrderRow } from "../ClosedOrders";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const fmtDecimal = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const TYPE_LABEL: Record<string, string> = {
  Vendor: "PO (Vendor)",
  Outlet: "PO (Outlet)",
  Transfer: "Transfer",
};
const TYPE_BADGE: Record<string, string> = {
  Vendor: "bg-blue-50 text-blue-700 border-blue-200",
  Outlet: "bg-purple-50 text-purple-700 border-purple-200",
  Transfer: "bg-teal-50 text-teal-700 border-teal-200",
};
const CLOSE_TYPE_BADGE: Record<string, string> = {
  Auto: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Manual: "bg-slate-50 text-slate-600 border-slate-200",
};

const RECEIVING_TAXES: Record<string, { igst: number; cgst: number; sgst: number }> = {
  co1: { igst: 2200, cgst: 1800, sgst: 1800 },
  co2: { igst: 1100, cgst: 900, sgst: 900 },
  co3: { igst: 490, cgst: 0, sgst: 0 },
  co4: { igst: 1575, cgst: 1260, sgst: 1260 },
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

function DetailField({ label, value, highlight, badge }: {
  label: string; value: React.ReactNode; highlight?: boolean; badge?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      {badge ? <div>{value}</div> : (
        <p className={`text-sm ${highlight ? "font-semibold text-primary" : "text-foreground"}`}>{value}</p>
      )}
    </div>
  );
}

export default function ViewClosedOrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const order = (location.state as { order?: ClosedOrderRow } | null)?.order;

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [taxOpen, setTaxOpen] = useState(false);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Closed order not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/procurements/closed-orders")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Closed Orders
        </Button>
      </div>
    );
  }

  const totalInvoice = order.receivings.reduce((s, r) => s + r.invoiceAmount, 0);
  const taxes = RECEIVING_TAXES[order.id] ?? { igst: 0, cgst: 0, sgst: 0 };
  const totalTax = taxes.igst + taxes.cgst + taxes.sgst;
  const receivingTotal = totalInvoice + totalTax;
  const variance = order.orderAmount - receivingTotal;
  const rate = fulfillmentRate(order.receivedQty, order.orderedQty);

  const showWastage =
    (order.supplierType === "Outlet" || order.supplierType === "Transfer") &&
    (order.wastageDetails ?? []).some((w) => w.wastageQty > 0);

  const handleExport = () => {
    const blob = new Blob(
      [`Closed Order: ${order.orderId}\nType: ${TYPE_LABEL[order.supplierType]}\nSupplier: ${order.supplier}\nOutlet: ${order.outlet}\nClosed At: ${order.closedAt}\nClosed By: ${order.closedBy}\nFulfillment Rate: ${rate}%\nReceiving Total: ${fmt(receivingTotal)}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${order.orderId}-closed-details.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate("/procurements/closed-orders")}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* Section 1: Order Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Order Details</CardTitle>
            <Badge variant="outline" className="text-xs px-3 py-1 border-emerald-200 bg-emerald-50 text-emerald-700">Closed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <DetailField label="Order ID" value={order.orderId} highlight />
            <DetailField label="Type" value={
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", TYPE_BADGE[order.supplierType])}>
                {TYPE_LABEL[order.supplierType]}
              </Badge>
            } badge />
            <DetailField label="Supplier / Source" value={order.supplier} />
            <DetailField label="Outlet" value={order.outlet} />
            <DetailField label="Ordered At" value={order.orderedAt} />
            <DetailField label="Expected Delivery" value={order.expectedDelivery} />
            <DetailField label="Ordered Qty" value={String(order.orderedQty)} />
            <DetailField label="Received Qty" value={<span className="text-emerald-700 font-medium">{order.receivedQty}</span>} badge />
            <DetailField label="Fulfillment Rate" value={<FulfillmentBadge rate={rate} />} badge />
            <DetailField label="Close Type" value={
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CLOSE_TYPE_BADGE[order.closeType])}>
                {order.closeType}
              </Badge>
            } badge />
            <DetailField label="Closed At" value={order.closedAt} />
            <DetailField label="Closed By" value={order.closedBy} />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Receiving History (Timeline) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Receiving History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-6">
              {order.receivings.map((r, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-primary bg-card" />
                  <div className="cento-card !p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block mb-0.5">GRN ID</span>
                        <span className="font-medium text-primary">{r.grnId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">GDN ID</span>
                        <span className="font-medium">{r.gdnId ?? "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Accepted Qty</span>
                        <span className="font-medium text-emerald-700">{r.acceptedQty}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Invoice Amount</span>
                        <span className="font-medium">{fmt(r.invoiceAmount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Receiving Date</span>
                        <span className="font-medium text-muted-foreground">{r.receivingDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Received By</span>
                        <span className="font-medium">{r.receivedBy}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-primary"
                        onClick={() => navigate(`/procurements/receivings/${r.grnId}`, { state: { fromClosed: true } })}>
                        View GRN <ExternalLink className="h-2.5 w-2.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Wastage Details — PO(Outlet) / Transfer only */}
      {showWastage && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Wastage Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(order.wastageDetails ?? [])
                .filter((w) => w.wastageQty > 0)
                .map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{item.materialName}</span>
                      <span className="text-xs font-semibold text-amber-700">Wastage Qty: {item.wastageQty}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div><span className="text-muted-foreground">Short Reason:</span> <span className="font-medium">{item.shortReason}</span></div>
                      <div><span className="text-muted-foreground">Session Date:</span> <span className="font-medium">{item.sessionDate}</span></div>
                      <div><span className="text-muted-foreground">GRN ID:</span> <span className="font-medium">{item.grnId}</span></div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Receiving Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Receiving Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Quantity */}
            <div className="space-y-3 md:w-1/3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Ordered Qty</p>
                <p className="text-lg font-semibold text-foreground">{order.orderedQty}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Received Qty</p>
                <p className="text-lg font-semibold text-emerald-700">{order.receivedQty}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Fulfillment Rate</p>
                <FulfillmentBadge rate={rate} />
              </div>
            </div>

            {/* Right: Financial */}
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Order Amount</span>
                <span className="text-sm font-bold text-foreground">{fmt(order.orderAmount)}</span>
              </div>

              {/* Total Invoice — collapsible */}
              <div>
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => setInvoiceOpen(!invoiceOpen)}>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Total Invoice Amount
                    {invoiceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </span>
                  <span className="text-sm">{fmt(totalInvoice)}</span>
                </div>
                {invoiceOpen && (
                  <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-muted pl-3">
                    {order.receivings.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Invoice {idx + 1} ({r.receivingDate})</span>
                        <span>{fmtDecimal(r.invoiceAmount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Receiving Taxes — collapsible */}
              <div>
                <div className="flex items-center justify-between cursor-pointer group" onClick={() => totalTax > 0 && setTaxOpen(!taxOpen)}>
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Receiving Taxes
                    {totalTax > 0 && (taxOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </span>
                  <span className="text-sm">{fmt(totalTax)}</span>
                </div>
                {taxOpen && totalTax > 0 && (
                  <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-muted pl-3">
                    {taxes.igst > 0 && <div className="flex items-center justify-between text-xs text-muted-foreground"><span>IGST</span><span>{fmtDecimal(taxes.igst)}</span></div>}
                    {taxes.cgst > 0 && <div className="flex items-center justify-between text-xs text-muted-foreground"><span>CGST</span><span>{fmtDecimal(taxes.cgst)}</span></div>}
                    {taxes.sgst > 0 && <div className="flex items-center justify-between text-xs text-muted-foreground"><span>SGST</span><span>{fmtDecimal(taxes.sgst)}</span></div>}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Receiving Total</span>
                <span className="text-lg font-bold">{fmt(receivingTotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Order vs Received Variance</span>
                <span className={cn("text-sm font-medium", variance === 0 ? "text-emerald-700" : variance > 0 ? "text-amber-700" : "text-red-700")}>
                  {variance >= 0 ? "+" : ""}{fmt(variance)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
