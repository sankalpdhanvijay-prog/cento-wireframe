import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, Pencil, Lock, Download, ChevronDown, ChevronUp } from "lucide-react";
import { ConfirmationModal } from "@/components/ConfirmationModal";

// Reuse the same mock structure as Receivings.tsx for detail lookup
interface GRNMaterial {
  name: string;
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  unitPrice: number;
  taxPercent?: number;
  taxAmount: number;
  total: number;
  shortReason?: string;
  shortRemarks?: string;
  excessReason?: string;
  excessRemarks?: string;
  wastageQty?: number;
}

interface GRNDetail {
  id: string;
  grnId: string;
  poId?: string;
  receivingType: "PO-Based" | "Direct";
  orderType?: "Vendor" | "Outlet" | "Transfer";
  vendor: string;
  outlet: string;
  totalValue: number;
  orderedQty: number;
  receivedQty: number;
  pendingQty?: number;
  receivingDate: string;
  receivedBy: string;
  poCreatedBy: string;
  poCreatedOn: string;
  lastUpdated?: string;
  expectedDelivery?: string;
  closedBy?: string;
  cancelledBy?: string;
  status: "Drafted" | "Received" | "Partially Received" | "Cancelled" | "Closed";
  materials: GRNMaterial[];
  subtotal: number;
  totalTax: number;
  grandTotal: number;
}

const MOCK_GRN_DETAILS: GRNDetail[] = [
  {
    id: "1",
    grnId: "GRN-2026-001",
    poId: "PO-1001",
    receivingType: "PO-Based",
    orderType: "Vendor",
    vendor: "Fresh Farms Pvt Ltd",
    outlet: "Main Kitchen",
    totalValue: 32500,
    orderedQty: 150,
    receivedQty: 120,
    pendingQty: 30,
    receivingDate: "2026-02-10",
    receivedBy: "Rahul M.",
    poCreatedBy: "Rahul M.",
    poCreatedOn: "2026-01-20",
    lastUpdated: "2026-02-10",
    expectedDelivery: "2026-02-15",
    status: "Partially Received",
    materials: [
      { name: "Basmati Rice", orderedQty: 100, receivedQty: 95, pendingQty: 5, unitPrice: 85, taxPercent: 5, taxAmount: 403.75, total: 8478.75, shortReason: "Short Supply", shortRemarks: "Vendor shortage" },
      { name: "Olive Oil (Extra Virgin)", orderedQty: 50, receivedQty: 50, pendingQty: 0, unitPrice: 420, taxPercent: 12, taxAmount: 2520, total: 23520 },
    ],
    subtotal: 29632.75,
    totalTax: 2923.75,
    grandTotal: 32500,
  },
  {
    id: "2",
    grnId: "GRN-2026-002",
    receivingType: "Direct",
    orderType: "Vendor",
    vendor: "Spice World Traders",
    outlet: "Main Kitchen",
    totalValue: 8750,
    orderedQty: 45,
    receivedQty: 45,
    receivingDate: "2026-02-09",
    receivedBy: "Priya K.",
    poCreatedBy: "Priya K.",
    poCreatedOn: "2026-02-09",
    status: "Received",
    materials: [
      { name: "Cumin Powder", orderedQty: 45, receivedQty: 45, pendingQty: 0, unitPrice: 194, taxPercent: 18, taxAmount: 875, total: 8750 },
    ],
    subtotal: 7875,
    totalTax: 875,
    grandTotal: 8750,
  },
  {
    id: "3",
    grnId: "GRN-2026-003",
    poId: "PO-1002",
    receivingType: "PO-Based",
    orderType: "Outlet",
    vendor: "Daily Dairy Supplies",
    outlet: "Branch - Indiranagar",
    totalValue: 28800,
    orderedQty: 80,
    receivedQty: 80,
    receivingDate: "2026-02-08",
    receivedBy: "Ankit S.",
    poCreatedBy: "Ankit S.",
    poCreatedOn: "2026-01-15",
    status: "Received",
    materials: [
      { name: "Mozzarella Cheese", orderedQty: 80, receivedQty: 70, pendingQty: 10, unitPrice: 360, taxPercent: 12, taxAmount: 3024, total: 25200, shortReason: "Damaged", shortRemarks: "Packaging torn", wastageQty: 8 },
      { name: "Paneer Block", orderedQty: 20, receivedQty: 20, pendingQty: 0, unitPrice: 180, taxPercent: 12, taxAmount: 432, total: 3600 },
    ],
    subtotal: 25344,
    totalTax: 3456,
    grandTotal: 28800,
  },
  {
    id: "4",
    grnId: "GRN-2026-004",
    receivingType: "Direct",
    orderType: "Vendor",
    vendor: "Fresh Farms Pvt Ltd",
    outlet: "Branch - Koramangala",
    totalValue: 4200,
    orderedQty: 30,
    receivedQty: 0,
    receivingDate: "2026-02-07",
    receivedBy: "—",
    poCreatedBy: "Sona R.",
    poCreatedOn: "2026-02-07",
    cancelledBy: "Admin",
    status: "Drafted",
    materials: [
      { name: "Onion (Red)", orderedQty: 30, receivedQty: 0, pendingQty: 30, unitPrice: 140, taxPercent: 0, taxAmount: 0, total: 4200 },
    ],
    subtotal: 4200,
    totalTax: 0,
    grandTotal: 4200,
  },
  {
    id: "5",
    grnId: "GRN-2026-005",
    poId: "PO-1003",
    receivingType: "PO-Based",
    orderType: "Transfer",
    vendor: "Daily Dairy Supplies",
    outlet: "Main Kitchen",
    totalValue: 54000,
    orderedQty: 200,
    receivedQty: 180,
    pendingQty: 20,
    receivingDate: "2026-02-11",
    receivedBy: "Rahul M.",
    poCreatedBy: "Rahul M.",
    poCreatedOn: "2026-01-28",
    lastUpdated: "2026-02-11",
    status: "Partially Received",
    materials: [
      { name: "Cream 5L", orderedQty: 100, receivedQty: 90, pendingQty: 10, unitPrice: 270, taxPercent: 12, taxAmount: 2916, total: 27000, shortReason: "Short Supply", shortRemarks: "Partial batch", wastageQty: 5 },
      { name: "Butter 1kg", orderedQty: 100, receivedQty: 90, pendingQty: 10, unitPrice: 270, taxPercent: 12, taxAmount: 2916, total: 27000, shortReason: "Damaged", wastageQty: 10 },
    ],
    subtotal: 48168,
    totalTax: 5832,
    grandTotal: 54000,
  },
  {
    id: "6",
    grnId: "GRN-2026-006",
    poId: "PO-1004",
    receivingType: "PO-Based",
    orderType: "Vendor",
    vendor: "Spice World Traders",
    outlet: "Main Kitchen",
    totalValue: 12000,
    orderedQty: 60,
    receivedQty: 0,
    receivingDate: "-",
    receivedBy: "—",
    poCreatedBy: "Priya K.",
    poCreatedOn: "2026-02-01",
    cancelledBy: "Admin",
    status: "Cancelled",
    materials: [
      { name: "Black Pepper", orderedQty: 60, receivedQty: 0, pendingQty: 60, unitPrice: 200, taxPercent: 0, taxAmount: 0, total: 12000 },
    ],
    subtotal: 12000,
    totalTax: 0,
    grandTotal: 12000,
  },
];

const STATUS_COLOR: Record<string, string> = {
  Drafted: "bg-muted text-muted-foreground",
  Received: "bg-green-50 text-green-700 border-green-200",
  "Partially Received": "bg-amber-50 text-amber-700 border-amber-200",
  Closed: "bg-neutral-100 text-neutral-600 border-neutral-300",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDecimal = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export { MOCK_GRN_DETAILS };
export type { GRNDetail };

export default function ViewReceivingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isClosedOrder = pathname.startsWith("/procurements/closed-orders");
  const [confirmAction, setConfirmAction] = useState<{ action: string; title: string; description: string } | null>(null);
  const [taxBreakdownOpen, setTaxBreakdownOpen] = useState(false);

  const grn = MOCK_GRN_DETAILS.find((g) => g.id === id);

  if (!grn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Receiving not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/procurements/receivings")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Receivings
        </Button>
      </div>
    );
  }

  const isPartial = grn.status === "Partially Received";
  const shortItems = grn.materials.filter((m) => m.shortReason);
  const excessItems = grn.materials.filter((m) => m.excessReason);

  // Build tax bifurcation from materials
  const taxBifurcation: Record<string, number> = {};
  grn.materials.forEach((m) => {
    if (m.taxAmount > 0) {
      const label = m.taxPercent ? `GST ${m.taxPercent}%` : "Tax";
      taxBifurcation[label] = (taxBifurcation[label] ?? 0) + m.taxAmount;
    }
  });

  const executeAction = (action: string) => {
    switch (action) {
      case "cancel": navigate("/procurements/receivings", { state: { tab: "cancelled" } }); break;
      case "edit": navigate(grn.receivingType === "PO-Based" ? "/procurements/new-receiving/po" : "/procurements/new-receiving/direct"); break;
      case "close": navigate("/procurements/receivings", { state: { tab: "received" } }); break;
    }
  };

  const handleAction = (action: string) => {
    const confirmMap: Record<string, { title: string; description: string }> = {
      cancel: { title: "Cancellation Confirmation", description: "Clicking on Confirm will Cancel this Receiving." },
      edit: { title: "Edit Confirmation", description: "Clicking on Confirm will open this Receiving for editing." },
      close: { title: "Close Confirmation", description: "Clicking on Confirm will Close & Update Stock for this Receiving." },
    };
    const conf = confirmMap[action];
    if (conf) setConfirmAction({ action, ...conf });
    else executeAction(action);
  };

  const handleExport = () => {
    const blob = new Blob([`Receiving Details: ${grn.grnId}\nVendor: ${grn.vendor}\nOutlet: ${grn.outlet}\nTotal: ${fmt(grn.grandTotal)}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${grn.grnId}-details.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleExport}>
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {/* SECTION 1: Receiving Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Receiving Details</CardTitle>
            <Badge variant="outline" className={`text-xs px-3 py-1 ${STATUS_COLOR[grn.status] ?? ""}`}>
              {grn.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            <DetailField label="GRN ID" value={grn.grnId} highlight />
            <DetailField label="Vendor Name" value={grn.vendor} />
            <DetailField label="Outlet" value={grn.outlet} />
            <DetailField label="Created By" value={grn.poCreatedBy} />
            <DetailField label="Created On" value={grn.poCreatedOn} />
            <DetailField label="Received On" value={grn.receivingDate} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            <DetailField label="Received By" value={grn.receivedBy} />
            <DetailField label="Current Status" value={grn.status} />
            {grn.expectedDelivery && <DetailField label="Expected Delivery Date" value={grn.expectedDelivery} />}
            {grn.lastUpdated && <DetailField label="Last Updated" value={grn.lastUpdated} />}
            {grn.closedBy && <DetailField label="Closed By" value={grn.closedBy} />}
            {grn.cancelledBy && <DetailField label="Cancelled By" value={grn.cancelledBy} />}
            {grn.poId && <DetailField label="PO ID" value={grn.poId} />}
            <DetailField label="Receiving Type" value={grn.receivingType} />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Materials Received */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Materials Received</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Received Qty</TableHead>
                {isPartial && <TableHead className="text-right">Pending</TableHead>}
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax Amount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grn.materials.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.orderedQty}</TableCell>
                  <TableCell className="text-right text-emerald-700 font-medium">{m.receivedQty}</TableCell>
                  {isPartial && (
                    <TableCell className="text-right text-amber-600 font-medium">{m.pendingQty}</TableCell>
                  )}
                  <TableCell className="text-right">{fmt(m.unitPrice)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{fmt(m.taxAmount)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(m.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Short Supply Details */}
      {shortItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-amber-700">Short Supply Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shortItems.map((m, i) => {
              const isOutletOrTransfer = grn.orderType === "Outlet" || grn.orderType === "Transfer";
              return (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 space-y-1">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Ordered: <strong>{m.orderedQty}</strong></span>
                    <span>Accepted: <strong>{m.receivedQty}</strong></span>
                    <span>Short: <strong className="text-amber-700">{m.orderedQty - m.receivedQty}</strong></span>
                  </div>
                  {m.shortReason && <p className="text-xs">Reason: <span className="font-medium">{m.shortReason}</span></p>}
                  {isOutletOrTransfer && m.wastageQty !== undefined && (
                    <p className="text-xs">Wastage Qty: <span className="font-medium text-amber-700">{m.wastageQty}</span></p>
                  )}
                  {m.shortRemarks && <p className="text-xs text-muted-foreground">Remarks: {m.shortRemarks}</p>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Excess Supply Details */}
      {excessItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-red-700">Excess Supply Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {excessItems.map((m, i) => (
              <div key={i} className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 space-y-1">
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Ordered: <strong>{m.orderedQty}</strong></span>
                  <span>Accepted: <strong>{m.receivedQty}</strong></span>
                  <span>Excess: <strong className="text-red-700">{m.receivedQty - m.orderedQty}</strong></span>
                </div>
                {m.excessReason && <p className="text-xs">Reason: <span className="font-medium">{m.excessReason}</span></p>}
                {m.excessRemarks && <p className="text-xs text-muted-foreground">Remarks: {m.excessRemarks}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: Receiving Summary with Tax Bifurcation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Receiving Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <SummaryRow label="Invoice Subtotal" value={fmt(grn.subtotal)} />
            {/* Total Tax with collapsible bifurcation */}
            <div>
              <div
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => Object.keys(taxBifurcation).length > 0 && setTaxBreakdownOpen(!taxBreakdownOpen)}
              >
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  Total Tax
                  {Object.keys(taxBifurcation).length > 0 && (
                    taxBreakdownOpen
                      ? <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      : <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </span>
                <span className="text-sm">{fmt(grn.totalTax)}</span>
              </div>
              {taxBreakdownOpen && Object.keys(taxBifurcation).length > 0 && (
                <div className="ml-4 mt-1.5 space-y-1 border-l-2 border-muted pl-3">
                  {Object.entries(taxBifurcation).map(([label, amount]) => (
                    <div key={label} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{label}</span>
                      <span>{fmtDecimal(amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <SummaryRow label="Grand Total" value={fmt(grn.grandTotal)} bold />
          </div>
        </CardContent>
      </Card>

      {/* Sticky Footer CTAs */}
      {!isClosedOrder && (grn.status === "Drafted" || grn.status === "Received" || grn.status === "Partially Received") && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
          <div className="max-w-[1000px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
            {grn.status === "Drafted" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction("edit")}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </>
            )}
            {(grn.status === "Received" || grn.status === "Partially Received") && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("close")}>
                  <Lock className="h-3.5 w-3.5 mr-1" /> Close &amp; Update Stock
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        onConfirm={() => { if (confirmAction) executeAction(confirmAction.action); setConfirmAction(null); }}
        confirmLabel="Confirm"
        confirmVariant={confirmAction?.action === "cancel" ? "destructive" : "default"}
      />
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
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-lg" : ""}`}>{value}</span>
    </div>
  );
}
