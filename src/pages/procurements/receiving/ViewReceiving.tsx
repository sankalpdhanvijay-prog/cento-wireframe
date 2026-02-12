import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, MapPin, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  POSummaryBlock,
  DirectSummaryBlock,
  ShortSupplySection,
  type ReceivingMaterialRow,
} from "./ReceivingFormShared";

const MOCK_VIEW_DATA = {
  receivingId: "RCV-2026-001",
  poNumber: "PO-2026-045",
  vendor: "Fresh Farms Pvt Ltd",
  outlet: "Main Kitchen",
  date: "2026-02-10",
  type: "PO Based" as const,
  materials: [
    { id: "1", materialId: "m1", name: "Basmati Rice", unit: "KG", orderedQty: 100, acceptedQty: 95, poUnitPrice: 85, invoiceUnitPrice: 85, taxPercent: 5, lineTotal: 8075, taxAmount: 403.75, totalLineAmount: 8478.75, hasError: false, errorMessage: "", shortReason: "Short Supply", shortRemarks: "" },
    { id: "2", materialId: "m2", name: "Olive Oil (Extra Virgin)", unit: "LTR", orderedQty: 50, acceptedQty: 50, poUnitPrice: 420, invoiceUnitPrice: 420, taxPercent: 12, lineTotal: 21000, taxAmount: 2520, totalLineAmount: 23520, hasError: false, errorMessage: "", shortReason: "", shortRemarks: "" },
    { id: "3", materialId: "m4", name: "Onion (Red)", unit: "KG", orderedQty: 50, acceptedQty: 48, poUnitPrice: 32, invoiceUnitPrice: 34, taxPercent: 0, lineTotal: 1632, taxAmount: 0, totalLineAmount: 1632, hasError: false, errorMessage: "", shortReason: "Quality Issue", shortRemarks: "Some onions showed signs of rot." },
  ] as ReceivingMaterialRow[],
};

export default function ViewReceiving() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = MOCK_VIEW_DATA;
  const isPO = data.type === "PO Based";

  const totals = {
    totalAccepted: data.materials.reduce((s, r) => s + r.acceptedQty, 0),
    poTotal: data.materials.reduce((s, r) => s + r.orderedQty * r.poUnitPrice, 0),
    invoiceSubtotal: data.materials.reduce((s, r) => s + r.lineTotal, 0),
    totalTax: data.materials.reduce((s, r) => s + r.taxAmount, 0),
    grandTotal: data.materials.reduce((s, r) => s + r.totalLineAmount, 0),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/procurements/new-receiving")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-foreground">{data.outlet}</span>
            <span className="text-xs text-muted-foreground font-mono">{data.receivingId}</span>
            <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">Submitted</Badge>
            <span className="text-xs text-muted-foreground">{format(new Date(data.date), "dd MMM yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
              <CheckCircle2 className="h-3 w-3" />
              Stock Updated
            </div>
            <Badge variant="outline" className="text-[10px] border-border bg-muted/50 text-muted-foreground">{data.type}</Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto max-w-6xl">
        {/* PO Context */}
        {data.poNumber && (
          <div className="cento-card">
            <h3 className="cento-section-header mb-2">Purchase Order</h3>
            <div className="text-sm">
              <span className="font-medium text-foreground">{data.poNumber}</span>
              <span className="text-muted-foreground ml-2">· {data.vendor}</span>
            </div>
          </div>
        )}

        {/* Materials (read-only) */}
        <div className="cento-card !p-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="cento-section-header">Materials Received</h3>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className={cn(
                "grid gap-2 px-4 py-2.5 bg-muted/30 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider",
                isPO
                  ? "grid-cols-[1.4fr_70px_80px_90px_100px_60px_90px_80px_100px]"
                  : "grid-cols-[1.5fr_80px_100px_60px_90px_80px_90px]"
              )}>
                <span>Item Name</span>
                {isPO && <span className="text-right">Ordered</span>}
                <span className="text-right">Accepted</span>
                {isPO && <span className="text-right">PO Price</span>}
                <span className="text-right">Invoice Price</span>
                <span className="text-right">Tax %</span>
                <span className="text-right">Line Total</span>
                <span className="text-right">Tax Amt</span>
                <span className="text-right">Total</span>
              </div>
              {data.materials.map((row) => {
                const priceMismatch = isPO && row.invoiceUnitPrice !== row.poUnitPrice;
                return (
                  <div key={row.id} className={cn(
                    "grid gap-2 px-4 py-3 items-center border-b border-border/40",
                    isPO
                      ? "grid-cols-[1.4fr_70px_80px_90px_100px_60px_90px_80px_100px]"
                      : "grid-cols-[1.5fr_80px_100px_60px_90px_80px_90px]"
                  )}>
                    <span className="text-sm font-medium text-foreground">{row.name}
                      <span className="text-xs text-muted-foreground ml-1.5">{row.unit}</span>
                    </span>
                    {isPO && <span className="text-sm text-muted-foreground text-right">{row.orderedQty}</span>}
                    <span className="text-sm text-foreground text-right font-medium">{row.acceptedQty}</span>
                    {isPO && <span className="text-sm text-muted-foreground text-right">₹{row.poUnitPrice.toFixed(2)}</span>}
                    <div className="text-right">
                      <span className="text-sm text-foreground">₹{row.invoiceUnitPrice.toFixed(2)}</span>
                      {priceMismatch && (
                        <Badge variant="outline" className="ml-1 text-[8px] px-1 py-0 border-amber-300 bg-amber-50 text-amber-700 leading-tight">
                          Mismatch
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground text-right">{row.taxPercent}%</span>
                    <span className="text-sm text-foreground text-right">₹{row.lineTotal.toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground text-right">₹{row.taxAmount.toFixed(2)}</span>
                    <span className="text-sm font-semibold text-foreground text-right">₹{row.totalLineAmount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Short Supply (read-only) */}
        {isPO && <ShortSupplySection materials={data.materials} onUpdate={() => {}} readOnly />}

        {/* Summary */}
        {isPO ? (
          <POSummaryBlock {...totals} />
        ) : (
          <DirectSummaryBlock
            invoiceSubtotal={totals.invoiceSubtotal}
            totalTax={totals.totalTax}
            grandTotal={totals.grandTotal}
          />
        )}
      </div>
    </div>
  );
}
