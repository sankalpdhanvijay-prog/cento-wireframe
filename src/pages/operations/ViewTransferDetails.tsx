import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, XCircle, Pencil, Download } from "lucide-react";
import { useTransferStore, type TransferStatus } from "@/context/TransferStoreContext";
import { ConfirmationModal } from "@/components/ConfirmationModal";

const STATUS_COLOR: Record<TransferStatus, string> = {
  Drafted: "bg-muted text-muted-foreground",
  Raised: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function ViewTransferDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTransfer, updateTransferStatus } = useTransferStore();
  const [confirmAction, setConfirmAction] = useState<{ action: string; title: string; description: string } | null>(null);

  const to = id ? getTransfer(id) : undefined;

  if (!to) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Transfer order not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/operations/transfers")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Transfers
        </Button>
      </div>
    );
  }

  const showExport = to.status === "Raised" || to.status === "Approved" || to.status === "Cancelled";

  const executeAction = (action: string) => {
    switch (action) {
      case "edit": navigate("/operations/transfers/new-transfer", { state: { editTO: to.id } }); break;
      case "approve": updateTransferStatus(to.id, "Approved"); navigate("/operations/transfers", { state: { tab: "approved" } }); break;
      case "cancel": updateTransferStatus(to.id, "Cancelled"); navigate("/operations/transfers", { state: { tab: "cancelled" } }); break;
    }
  };

  const handleAction = (action: string) => {
    const confirmMap: Record<string, { title: string; description: string }> = {
      approve: { title: "Approval Confirmation", description: "Clicking on Confirm will Approve the Transfer Order." },
      cancel: { title: "Cancellation Confirmation", description: "Clicking on Confirm will Cancel the Transfer Order." },
      edit: { title: "Edit Confirmation", description: "Clicking on Confirm will open the Transfer Order for editing." },
    };
    const conf = confirmMap[action];
    if (conf) setConfirmAction({ action, ...conf });
    else executeAction(action);
  };

  const handleExport = () => {
    const blob = new Blob([`Transfer Details: ${to.id}\nSender: ${to.senderOutlet}\nTotal: ${fmt(to.grandTotal)}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${to.id}-details.txt`; a.click();
    URL.revokeObjectURL(url);
  };

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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Transfer Order Details</CardTitle>
            <Badge variant="outline" className={`text-xs px-3 py-1 ${STATUS_COLOR[to.status]}`}>{to.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4 mb-4">
            <DetailField label="STN ID" value={to.id} highlight />
            <DetailField label="Buyer's Outlet" value={to.buyerOutlet} />
            <DetailField label="Sender's Outlet" value={to.senderOutlet} />
            <DetailField label="Expected Delivery Date" value={to.expectedDelivery ?? "—"} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <DetailField label="Created By" value={to.createdBy} />
            <DetailField label="Created On" value={to.createdOn} />
            <DetailField label="Remarks" value={to.remarks || "—"} />
            {to.approvedOn && <DetailField label="Approved On" value={to.approvedOn} />}
            {to.lastUpdated && <DetailField label="Last Updated" value={to.lastUpdated} />}
            {to.cancelledBy && <DetailField label="Cancelled By" value={to.cancelledBy} />}
            {to.cancelledDate && <DetailField label="Cancelled Date" value={to.cancelledDate} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Materials Details</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Transfer Qty</TableHead>
                <TableHead className="text-right">Transfer Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {to.materials.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.orderedQty}</TableCell>
                  <TableCell className="text-right">{m.transferPrice > 0 ? fmt(m.transferPrice) : "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(m.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Transfer Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <SummaryRow label="Subtotal" value={fmt(to.subtotal)} />
            {(to.otherCharges ?? 0) > 0 && <SummaryRow label="Other Charges" value={fmt(to.otherCharges!)} />}
            <Separator />
            <SummaryRow label="Grand Total" value={fmt(to.grandTotal)} bold />
          </div>
        </CardContent>
      </Card>

      {(to.status === "Drafted" || to.status === "Raised") && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
          <div className="max-w-[1000px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
            {to.status === "Drafted" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}><XCircle className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                <Button variant="outline" size="sm" onClick={() => handleAction("edit")}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
              </>
            )}
            {to.status === "Raised" && (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleAction("cancel")}><XCircle className="h-3.5 w-3.5 mr-1" /> Cancel</Button>
                <Button variant="cento" size="sm" onClick={() => handleAction("approve")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve</Button>
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
