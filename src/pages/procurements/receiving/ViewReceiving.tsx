import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, MapPin, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MaterialRow,
  SummaryBlock,
  type ReceivingMaterialRow,
} from "./ReceivingFormShared";

// Mock submitted receiving data
const MOCK_VIEW_DATA = {
  receivingId: "RCV-2026-001",
  poNumber: "PO-2026-045",
  vendor: "Fresh Farms Pvt Ltd",
  outlet: "Main Kitchen",
  date: "2026-02-10",
  type: "PO Based" as const,
  materials: [
    { id: "1", materialId: "m1", name: "Basmati Rice", unit: "KG", orderedQty: 100, previouslyReceived: 0, pendingQty: 100, acceptedQty: 95, damagedQty: 5, cases: 10, receivingQty: 100, damagedRemarks: "Two bags had moisture damage, grains clumped together.", hasError: false, remarksRequired: false },
    { id: "2", materialId: "m2", name: "Olive Oil (Extra Virgin)", unit: "LTR", orderedQty: 50, previouslyReceived: 0, pendingQty: 50, acceptedQty: 50, damagedQty: 0, cases: 5, receivingQty: 50, damagedRemarks: "", hasError: false, remarksRequired: false },
    { id: "3", materialId: "m4", name: "Onion (Red)", unit: "KG", orderedQty: 50, previouslyReceived: 0, pendingQty: 50, acceptedQty: 48, damagedQty: 2, cases: 0, receivingQty: 50, damagedRemarks: "Some onions showed signs of rot.", hasError: false, remarksRequired: false },
  ] as ReceivingMaterialRow[],
};

export default function ViewReceiving() {
  const navigate = useNavigate();
  const { id } = useParams();

  const data = MOCK_VIEW_DATA;
  const totals = {
    totalAccepted: data.materials.reduce((s, r) => s + r.acceptedQty, 0),
    totalDamaged: data.materials.reduce((s, r) => s + r.damagedQty, 0),
    totalReceiving: data.materials.reduce((s, r) => s + r.receivingQty, 0),
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
            <div className="flex items-center gap-3">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-foreground">{data.outlet}</span>
              <span className="text-xs text-muted-foreground font-mono">{data.receivingId}</span>
              <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700">
                Submitted
              </Badge>
              <span className="text-xs text-muted-foreground">{format(new Date(data.date), "dd MMM yyyy")}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-2.5 py-1">
              <CheckCircle2 className="h-3 w-3" />
              Stock Updated
            </div>
            <Badge variant="outline" className="text-[10px] border-border bg-muted/50 text-muted-foreground">
              {data.type}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-auto max-w-5xl">
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
          <div className="grid grid-cols-[1.5fr_70px_80px_80px_80px_90px_90px_70px_80px] gap-3 px-4 py-2.5 bg-muted/30 border-b text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Material</span>
            <span>Unit</span>
            <span className="text-right">Ordered</span>
            <span className="text-right">Prev. Rcvd</span>
            <span className="text-right">Pending</span>
            <span>Accepted</span>
            <span>Damaged</span>
            <span>Cases</span>
            <span className="text-right">Rcv Qty</span>
          </div>
          {data.materials.map((row) => (
            <MaterialRow
              key={row.id}
              row={row}
              showPOColumns
              readOnly
              expandedDamaged={null}
              onToggleDamaged={() => {}}
              onUpdate={() => {}}
            />
          ))}
        </div>

        <SummaryBlock {...totals} />
      </div>
    </div>
  );
}
