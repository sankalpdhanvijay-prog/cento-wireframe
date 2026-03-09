import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  ArrowLeft, CheckCircle2, XCircle, Package, Pencil, Download, Trash2, ChevronDown, ChevronUp, AlertTriangle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { usePOStore, type POStatus } from "@/context/POStoreContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const STATUS_COLOR: Record<POStatus, string> = {
  Drafted: "bg-muted text-muted-foreground",
  Raised: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  "Partially Received": "bg-amber-50 text-amber-700 border-amber-200",
  Received: "bg-green-50 text-green-700 border-green-200",
  Closed: "bg-neutral-100 text-neutral-600 border-neutral-300",
  Rejected: "bg-red-50 text-red-600 border-red-200",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ViewOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrder, updateOrderStatus, deleteOrder } = usePOStore();
  const [taxBreakdownOpen, setTaxBreakdownOpen] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{ action: string; title: string; description: string } | null>(null);
  const [noDispatchModal, setNoDispatchModal] = useState(false);

  const po = id ? getOrder(id) : undefined;

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Order not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/procurements/purchases")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Purchases
        </Button>
      </div>
    );
  }

  const showReceivingTotals = po.status === "Partially Received" || po.status === "Closed";
  const showExport = po.status === "Approved";

  // Mock: simulate hasDispatches — true for PO-1005 only
  const hasDispatches = po.id === "PO-1005";

  const executeAction = (action: string) => {
    switch (action) {
      case "edit":
        navigate("/procurements/new-purchase", { state: { editPO: po.id } });
        break;
      case "approve":
        updateOrderStatus(po.id, "Approved");
        navigate("/procurements/purchases", { state: { tab: "approved" } });
        break;
      case "receive":
        if (hasDispatches) {
          navigate("/procurements/receivings", { state: { tab: "pending", poId: po.id } });
        } else {
          setNoDispatchModal(true);
        }
        break;
      case "reject":
        updateOrderStatus(po.id, "Rejected");
        navigate("/procurements/purchases", { state: { tab: "rejected" } });
        break;
      case "delete":
        deleteOrder(po.id);
        navigate("/procurements/purchases", { state: { tab: "drafted" } });
        break;
    }
  };

  const handleAction = (action: string) => {
    const confirmMap: Record<string, { title: string; description: string }> = {
      approve: { title: "Approval Confirmation", description: "Clicking on Confirm will Approve the Purchase Order." },
      reject: { title: "Rejection Confirmation", description: "Clicking on Confirm will Reject this Purchase Order." },
      edit: { title: "Edit Confirmation", description: "Clicking on Confirm will open the Purchase Order for editing." },
      delete: {
        title: "Delete Draft PO?",
        description: `This will permanently delete ${po.id} for ${po.vendor} (${fmt(po.totalValue)}). This cannot be undone.`,
      },
    };
    const conf = confirmMap[action];
    if (conf) {
      setConfirmAction({ action, ...conf });
    } else {
      executeAction(action);
    }
  };

  const handleExport = () => {
    const blob = new Blob([`PO Details: ${po.id}\nVendor: ${po.vendor}\nTotal: ${fmt(po.grandTotal)}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${po.id}-details.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const taxBreakdown = po.taxBreakdown ?? (() => {
    const bd: Record<string, number> = {};
    if (po.totalTax > 0) bd["Tax"] = po.totalTax;
    return bd;
  })();

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
        </Button>
        {showExport && (
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        )}
      </div>

      {/* SECTION 1: PO Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">PO Details</CardTitle>
            <Badge variant="outline" className={`text-xs px-3 py-1 ${STATUS_COLOR[po.status]}`}>{po.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 mb-4">
            <DetailField label="PO ID" value={po.id} highlight />
            <DetailField label="Buying Outlet" value={po.outlet} />
            <DetailField label="Supplier Type" value={po.supplierType || "Vendor"} />
            <DetailField label={po.supplierType === "Outlet" ? "Supplying Outlet" : "Vendor"} value={po.vendor} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <DetailField label="Created By" value={po.createdBy} />
            <DetailField label="Created On" value={po.createdOn} />
            <DetailField label="Expected Delivery Date" value={po.expectedDelivery ?? "—"} />
            <DetailField label="Remarks" value={po.remarks || "—"} />
            {po.approvedOn && <DetailField label="Approved On" value={po.approvedOn} />}
            {po.approvedBy && <DetailField label="Approved By" value={po.approvedBy} />}
            {po.status === "Approved" && po.prnId && <DetailField label="PRN ID" value={po.prnId} highlight />}
            {po.lastUpdated && <DetailField label="Last Updated" value={po.lastUpdated} />}
            {po.closedBy && <DetailField label="Closed By" value={po.closedBy} />}
            {po.closedDate && <DetailField label="Closed Date" value={po.closedDate} />}
            {po.rejectedBy && <DetailField label="Rejected By" value={po.rejectedBy} />}
            {po.rejectedOn && <DetailField label="Rejected On" value={po.rejectedOn} />}
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
                <TableHead>Material Code</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Ordered Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Tax Amount</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.materials.map((m, i) => {
                const taxAmount = m.lineTotal * (m.taxPct / 100);
                const total = m.lineTotal + taxAmount;
                return (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.code ?? "—"}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-right">{m.orderedQty}</TableCell>
                    <TableCell className="text-right">{fmt(m.unitPrice)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmt(taxAmount)}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
            <div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setTaxBreakdownOpen((v) => !v)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Total Tax</span>
                  {Object.keys(taxBreakdown).length > 0 && (
                    taxBreakdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                <span className="text-sm">{fmt(po.totalTax)}</span>
              </div>
              {taxBreakdownOpen && Object.keys(taxBreakdown).length > 0 && (
                <div className="mt-2 ml-3 space-y-1.5 border-l-2 border-border pl-3">
                  {Object.entries(taxBreakdown).map(([name, amt]) => (
                    <div key={name} className="flex justify-between text-xs text-muted-foreground">
                      <span>{name}</span>
                      <span className="tabular-nums">{fmt(amt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {(po.otherCharges ?? 0) > 0 && <SummaryRow label="Other Charges" value={fmt(po.otherCharges!)} />}
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
      {(po.status === "Drafted" || po.status === "Raised" || po.status === "Approved") && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
          <div className="max-w-[1000px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
            {po.status === "Drafted" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("delete")}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction("edit")}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              </>
            )}
            {po.status === "Raised" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("reject")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("approve")}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
              </>
            )}
            {po.status === "Approved" && (
              <Button variant="cento" size="sm" onClick={() => executeAction("receive")}>
                <Package className="h-3.5 w-3.5 mr-1" /> Receive Orders
              </Button>
            )}
          </div>
        </div>
      )}

      {/* No Dispatches Info Modal */}
      <Dialog open={noDispatchModal} onOpenChange={setNoDispatchModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> No Dispatches Found
            </DialogTitle>
            <DialogDescription>
              No dispatches associated with this PO yet. Please wait for dispatches to be created before receiving.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoDispatchModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        onConfirm={() => { if (confirmAction) executeAction(confirmAction.action); setConfirmAction(null); }}
        confirmLabel="Confirm"
        confirmVariant={confirmAction?.action === "reject" || confirmAction?.action === "delete" ? "destructive" : "default"}
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

function SummaryRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-lg" : ""} ${accent ? "text-emerald-700" : ""}`}>{value}</span>
    </div>
  );
}
