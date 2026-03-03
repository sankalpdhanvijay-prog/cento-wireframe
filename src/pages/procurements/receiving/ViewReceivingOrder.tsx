import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OrderRow } from "../Receivings";

/* Same mock data */
const MOCK_ORDERS: OrderRow[] = [
  {
    id: "or1", orderId: "PO-1005", orderType: "Vendor", supplier: "Sysco Foods", outlet: "Main Kitchen",
    orderedAt: "2026-01-20", expectedDelivery: "2026-02-01", orderedQty: 310, receivedQty: 180, pendingQty: 130, orderAmount: 44800,
    receivings: [],
  },
  {
    id: "or3", orderId: "PO-1008", orderType: "Outlet", supplier: "Fresh Direct", outlet: "Central Warehouse",
    orderedAt: "2026-01-08", expectedDelivery: "2026-02-03", orderedQty: 100, receivedQty: 0, pendingQty: 100, orderAmount: 15000,
    receivings: [],
  },
  {
    id: "or5", orderId: "PO-1003", orderType: "Vendor", supplier: "Metro Supply", outlet: "Main Kitchen",
    orderedAt: "2026-01-28", expectedDelivery: "2026-02-08", orderedQty: 200, receivedQty: 200, pendingQty: 0, orderAmount: 33490,
    receivings: [],
  },
];

const MOCK_MATERIALS = [
  { code: "RM-001", name: "Basmati Rice", unit: "KG", orderedQty: 100, acceptedQty: 100, invoiceUnitPrice: 220, taxAmount: 1980, lineTotal: 23980 },
  { code: "RM-002", name: "Sunflower Oil", unit: "LTR", orderedQty: 30, acceptedQty: 30, invoiceUnitPrice: 350, taxAmount: 1890, lineTotal: 12390 },
  { code: "RM-003", name: "Wheat Flour", unit: "KG", orderedQty: 40, acceptedQty: 40, invoiceUnitPrice: 75, taxAmount: 135, lineTotal: 3135 },
];

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ViewReceivingOrder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const order = MOCK_ORDERS.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/procurements/receivings")}>Go Back</Button>
      </div>
    );
  }

  const totals = MOCK_MATERIALS.reduce((acc, m) => ({
    invoiceSubtotal: acc.invoiceSubtotal + m.acceptedQty * m.invoiceUnitPrice,
    totalTax: acc.totalTax + m.taxAmount,
    grandTotal: acc.grandTotal + m.lineTotal,
  }), { invoiceSubtotal: 0, totalTax: 0, grandTotal: 0 });

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-4 -mx-1 px-1 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/procurements/receivings")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-lg font-semibold">Receiving Details</h1>
            <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">Received</Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto pb-16 max-w-6xl">
        {/* Order Details */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Order Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KV label="Order ID" value={order.orderId} />
            <KV label="Order Type" value={order.orderType} />
            <KV label="Supplier" value={order.supplier} />
            <KV label="Outlet" value={order.outlet} />
            <KV label="Ordered At" value={format(new Date(order.orderedAt), "dd MMM yyyy")} />
            <KV label="Expected Delivery" value={format(new Date(order.expectedDelivery), "dd MMM yyyy")} />
            <KV label="Ordered Qty" value={String(order.orderedQty)} />
            <KV label="Order Amount" value={fmt(order.orderAmount)} />
          </div>
        </div>

        {/* Materials (read-only) */}
        <div className="cento-card !p-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="cento-section-header">Materials</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Material Name</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ordered</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Accepted</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice Price</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tax Amt</th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_MATERIALS.map((m, idx) => (
                  <tr key={idx} className="border-b border-border/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{m.code}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{m.name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.unit}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{m.orderedQty}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">{m.acceptedQty}</td>
                    <td className="px-4 py-3 text-right tabular-nums">₹{m.invoiceUnitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">₹{m.taxAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">₹{m.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="cento-card">
          <h3 className="cento-section-header mb-3">Receiving Summary</h3>
          <div className="space-y-2 max-w-xs ml-auto">
            <SummaryRow label="Invoice Subtotal" value={`₹${totals.invoiceSubtotal.toLocaleString("en-IN")}`} />
            <SummaryRow label="Total Tax" value={`₹${totals.totalTax.toLocaleString("en-IN")}`} />
            <div className="border-t border-border pt-2">
              <SummaryRow label="Grand Total" value={`₹${totals.grandTotal.toLocaleString("en-IN")}`} bold />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm", bold ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-sm tabular-nums", bold ? "font-bold text-foreground" : "font-medium text-foreground")}>{value}</span>
    </div>
  );
}
