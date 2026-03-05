import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClosedOrderRow } from "../ClosedOrders";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const TYPE_BADGE: Record<string, string> = {
  Vendor: "bg-blue-50 text-blue-700 border-blue-200",
  Outlet: "bg-purple-50 text-purple-700 border-purple-200",
  Transfer: "bg-teal-50 text-teal-700 border-teal-200",
};

export default function ViewClosedOrderDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const order = (location.state as { order?: ClosedOrderRow } | null)?.order;

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

  return (
    <div className="space-y-5 max-w-[1000px] pb-8">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

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
            {/* Timeline line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />
            <div className="space-y-6">
              {order.receivings.map((r, idx) => (
                <div key={idx} className="relative">
                  {/* Timeline dot */}
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

      {/* Section 4: Receiving Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Receiving Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5 max-w-xs ml-auto">
            <SummaryRow label="Order Amount" value={fmt(order.orderAmount)} />
            <SummaryRow label="Total Invoice Amount" value={fmt(totalInvoice)} />
            <Separator />
            <SummaryRow label="Total Received Qty" value={String(order.receivedQty)} bold />
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

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", bold ? "font-semibold" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-sm", bold ? "font-bold text-lg" : "")}>{value}</span>
    </div>
  );
}
