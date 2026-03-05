import { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClosedOrderRow } from "../ClosedOrders";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDecimal = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const TYPE_BADGE: Record<string, string> = {
  Vendor: "bg-blue-50 text-blue-700 border-blue-200",
  Outlet: "bg-purple-50 text-purple-700 border-purple-200",
  Transfer: "bg-teal-50 text-teal-700 border-teal-200",
};

// Mock tax data per receiving
const RECEIVING_TAXES: Record<string, { igst: number; cgst: number; sgst: number }> = {
  co1: { igst: 2200, cgst: 1800, sgst: 1800 },
  co2: { igst: 1100, cgst: 900, sgst: 900 },
  co3: { igst: 490, cgst: 0, sgst: 0 },
  co4: { igst: 1575, cgst: 1260, sgst: 1260 },
};

export default function ViewClosedOrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const order = (location.state as { order?: ClosedOrderRow } | null)?.order;
  const [invoiceBifurcationOpen, setInvoiceBifurcationOpen] = useState(false);
  const [taxBifurcationOpen, setTaxBifurcationOpen] = useState(false);

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

  const handleExport = () => {
    const blob = new Blob([`Closed Order: ${order.orderId}\nSupplier: ${order.supplier}\nTotal: ${fmt(order.orderAmount)}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${order.orderId}-closed-details.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
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
            <DetailField label="Supplier Type" value={order.supplierType} />
            <DetailField label="Supplier" value={order.supplier} />
            <DetailField label="Ordered At" value={order.orderedAt} />
            <DetailField label="Expected Delivery" value={order.expectedDelivery} />
            <DetailField label="Ordered Qty" value={String(order.orderedQty)} />
            <DetailField label="Received Qty" value={String(order.receivedQty)} />
            <DetailField label="Last Receiving Date" value={order.lastReceivingDate} />
            <DetailField label="Order Amount" value={fmt(order.orderAmount)} />
            <DetailField label="Closed At" value={order.closedAt} />
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
                        <span className="text-muted-foreground block mb-0.5">Requisition ID</span>
                        <span className="font-medium text-primary">{r.requisitionId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Received Qty</span>
                        <span className="font-medium text-emerald-700">{r.receivedQty}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Order Amount</span>
                        <span className="font-medium">{fmt(r.orderAmount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Invoice Amount</span>
                        <span className="font-medium">{fmt(r.invoiceAmount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Creation Date</span>
                        <span className="font-medium text-muted-foreground">{r.creationDate}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Created By</span>
                        <span className="font-medium">{r.createdBy}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-0.5">Receiving Date</span>
                        <span className="font-medium text-muted-foreground">{r.receivingDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Short Supply Details */}
      {order.shortSupply && order.shortSupply.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Short Supply Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.shortSupply.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="text-sm font-medium">{item.materialName}</span>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div><span className="text-muted-foreground">Ordered:</span> <span className="font-medium">{item.orderedQty}</span></div>
                    <div><span className="text-muted-foreground">Received:</span> <span className="font-medium text-emerald-700">{item.receivedQty}</span></div>
                    <div><span className="text-muted-foreground">Short:</span> <span className="font-semibold text-amber-700">{item.shortQty}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Receiving Summary - Two column layout */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Receiving Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Quantity summary */}
            <div className="space-y-3 md:w-1/3">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Ordered Qty</p>
                <p className="text-lg font-semibold text-foreground">{order.orderedQty}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Total Received Qty</p>
                <p className="text-lg font-semibold text-emerald-700">{order.receivedQty}</p>
              </div>
            </div>

            {/* Right: Financial summary */}
            <div className="flex-1 space-y-2.5">
              {/* Order Amount - highlighted */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Order Amount</span>
                <span className="text-sm font-bold text-foreground">{fmt(order.orderAmount)}</span>
              </div>

              {/* Total Received Invoice Amount - collapsible */}
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setInvoiceBifurcationOpen(!invoiceBifurcationOpen)}
                >
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Total Received Invoice Amount
                    {invoiceBifurcationOpen
                      ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    }
                  </span>
                  <span className="text-sm">{fmt(totalInvoice)}</span>
                </div>
                {invoiceBifurcationOpen && (
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

              {/* Receiving Taxes - collapsible */}
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => totalTax > 0 && setTaxBifurcationOpen(!taxBifurcationOpen)}
                >
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    Receiving Taxes
                    {totalTax > 0 && (
                      taxBifurcationOpen
                        ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                        : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                  <span className="text-sm">{fmt(totalTax)}</span>
                </div>
                {taxBifurcationOpen && totalTax > 0 && (
                  <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-muted pl-3">
                    {taxes.igst > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>IGST</span>
                        <span>{fmtDecimal(taxes.igst)}</span>
                      </div>
                    )}
                    {taxes.cgst > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>CGST</span>
                        <span>{fmtDecimal(taxes.cgst)}</span>
                      </div>
                    )}
                    {taxes.sgst > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>SGST</span>
                        <span>{fmtDecimal(taxes.sgst)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Receiving Total */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Receiving Total</span>
                <span className="text-lg font-bold">{fmt(receivingTotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
