import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, SendHorizonal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useDispatchStore } from "@/context/DispatchStoreContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// New Dispatch page (for creating a dispatch from a requisition)
export function NewDispatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addDispatch, removeNewDispatch } = useDispatchStore();
  const state = location.state as { requisitionId?: string; type?: "PO" | "TO" } | null;

  const requisitionId = state?.requisitionId ?? "PO-1003";
  const type = state?.type ?? "PO";

  const initialMaterials = [
    { name: "Tomato Paste 5kg", orderedQty: 80, dispatchQty: 80, unitPrice: 150, taxPct: 12 },
    { name: "Chickpeas 25kg", orderedQty: 60, dispatchQty: 60, unitPrice: 180, taxPct: 5 },
    { name: "Salt 50kg", orderedQty: 60, dispatchQty: 60, unitPrice: 136.67, taxPct: 5 },
  ];

  const [materials, setMaterials] = useState(initialMaterials);

  const updateDispatchQty = (index: number, value: number) => {
    const mat = materials[index];
    if (value > mat.orderedQty) {
      toast({ title: "Invalid Quantity", description: "Dispatching Stock cannot be more than Ordered Stock, Kindly review.", variant: "destructive" });
      return;
    }
    setMaterials((prev) => prev.map((m, i) => i === index ? { ...m, dispatchQty: value } : m));
  };

  const computeLineTotal = (m: typeof materials[0]) => m.dispatchQty * m.unitPrice;

  const subtotal = materials.reduce((s, m) => s + computeLineTotal(m), 0);
  const totalTax = materials.reduce((s, m) => s + (computeLineTotal(m) * m.taxPct / 100), 0);
  const grandTotal = subtotal + totalTax;

  const handleDelete = () => {
    removeNewDispatch(requisitionId);
    toast({ title: "Dispatch Deleted", description: `Dispatch for ${requisitionId} has been deleted.` });
    navigate("/operations/dispatches", { state: { tab: "deleted" } });
  };

  const handleDispatch = () => {
    const matPayload = materials.map((m) => ({ name: m.name, dispatchQty: m.dispatchQty, unitPrice: m.unitPrice, taxPct: m.taxPct, lineTotal: computeLineTotal(m) }));
    addDispatch({
      requisitionId, type, supplierType: type === "PO" ? "Vendor" : undefined,
      vendor: type === "PO" ? "Metro Supply" : undefined, deliverTo: "Main Kitchen",
      dispatchDate: format(new Date(), "yyyy-MM-dd"), status: "In Transit", createdBy: "Admin",
      materials: matPayload, subtotal, totalTax, otherCharges: 0, grandTotal,
    });
    removeNewDispatch(requisitionId);
    toast({ title: "Dispatch Created", description: `Dispatch for ${requisitionId} is now in transit.` });
    navigate("/operations/dispatches");
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
          <SendHorizonal className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="cento-page-title">New Dispatch Order</h2>
          <p className="cento-helper mt-0.5">Approve the dispatching of the order</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Purchase Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Purchase ID</p><p className="text-sm font-semibold text-primary">{requisitionId}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Supplier</p><p className="text-sm text-foreground">{type === "PO" ? "Vendor" : "Outlet"}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{type === "PO" ? "Vendor" : "Outlet"}</p><p className="text-sm text-foreground">{type === "PO" ? "Metro Supply" : "Central Warehouse"}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Materials ({materials.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Ordered Stock</TableHead>
                <TableHead className="text-right">Dispatch Stock</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m, i) => {
                const lineTotal = computeLineTotal(m);
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.orderedQty}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={m.orderedQty}
                        value={m.dispatchQty}
                        onChange={(e) => updateDispatchQty(i, parseInt(e.target.value) || 0)}
                        className="h-7 w-20 text-sm text-right ml-auto bg-background"
                      />
                    </TableCell>
                    <TableCell className="text-right">{fmt(m.unitPrice)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.taxPct > 0 ? `GST ${m.taxPct}%` : "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(lineTotal + lineTotal * m.taxPct / 100)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Dispatch Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tax</span><span>{fmt(totalTax)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm font-semibold">Grand Total</span><span className="text-lg font-bold">{fmt(grandTotal)}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
        <div className="max-w-[1000px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
          <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
          <Button variant="cento" size="sm" onClick={handleDispatch}><SendHorizonal className="h-3.5 w-3.5 mr-1" /> Dispatch</Button>
        </div>
      </div>
    </div>
  );
}

// Partial Dispatch page (for dispatching remaining qty from a partially dispatched order)
export function PartialDispatch() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addDispatch } = useDispatchStore();
  const state = location.state as { requisitionId?: string; type?: "PO" | "TO" } | null;

  const requisitionId = state?.requisitionId ?? "PO-1001";
  const type = state?.type ?? "PO";

  const initialMaterials = [
    { name: "Tomato Paste 5kg", pendingQty: 30, dispatchQty: 30, unitPrice: 150, taxPct: 12 },
    { name: "Chickpeas 25kg", pendingQty: 25, dispatchQty: 25, unitPrice: 180, taxPct: 5 },
    { name: "Salt 50kg", pendingQty: 20, dispatchQty: 20, unitPrice: 136.67, taxPct: 5 },
  ];

  const [materials, setMaterials] = useState(initialMaterials);

  const updateDispatchQty = (index: number, value: number) => {
    const mat = materials[index];
    if (value > mat.pendingQty) {
      toast({ title: "Invalid Quantity", description: "Dispatching Stock cannot be more than Pending Stock, Kindly review.", variant: "destructive" });
      return;
    }
    setMaterials((prev) => prev.map((m, i) => i === index ? { ...m, dispatchQty: value } : m));
  };

  const computeLineTotal = (m: typeof materials[0]) => m.dispatchQty * m.unitPrice;

  const subtotal = materials.reduce((s, m) => s + computeLineTotal(m), 0);
  const totalTax = materials.reduce((s, m) => s + (computeLineTotal(m) * m.taxPct / 100), 0);
  const grandTotal = subtotal + totalTax;

  const handleDispatch = () => {
    const matPayload = materials.map((m) => ({ name: m.name, dispatchQty: m.dispatchQty, unitPrice: m.unitPrice, taxPct: m.taxPct, lineTotal: computeLineTotal(m) }));
    addDispatch({
      requisitionId, type, supplierType: type === "PO" ? "Vendor" : undefined,
      vendor: type === "PO" ? "Metro Supply" : undefined, deliverTo: "Main Kitchen",
      dispatchDate: format(new Date(), "yyyy-MM-dd"), status: "In Transit", createdBy: "Admin",
      materials: matPayload, subtotal, totalTax, otherCharges: 0, grandTotal,
    });
    toast({ title: "Dispatch Created", description: `Dispatch for ${requisitionId} is now in transit.` });
    navigate("/operations/dispatches");
  };

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
          <SendHorizonal className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="cento-page-title">Partial Dispatch Order</h2>
          <p className="cento-helper mt-0.5">Dispatch remaining stock for {requisitionId}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Purchase Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Purchase ID</p><p className="text-sm font-semibold text-primary">{requisitionId}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Supplier</p><p className="text-sm text-foreground">{type === "PO" ? "Vendor" : "Outlet"}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{type === "PO" ? "Vendor" : "Outlet"}</p><p className="text-sm text-foreground">{type === "PO" ? "Metro Supply" : "Central Warehouse"}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Materials ({materials.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Pending Qty</TableHead>
                <TableHead className="text-right">Dispatch Stock</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m, i) => {
                const lineTotal = computeLineTotal(m);
                return (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{m.pendingQty}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={m.pendingQty}
                        value={m.dispatchQty}
                        onChange={(e) => updateDispatchQty(i, parseInt(e.target.value) || 0)}
                        className="h-7 w-20 text-sm text-right ml-auto bg-background"
                      />
                    </TableCell>
                    <TableCell className="text-right">{fmt(m.unitPrice)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.taxPct > 0 ? `GST ${m.taxPct}%` : "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(lineTotal + lineTotal * m.taxPct / 100)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Dispatch Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tax</span><span>{fmt(totalTax)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm font-semibold">Grand Total</span><span className="text-lg font-bold">{fmt(grandTotal)}</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-30">
        <div className="max-w-[1000px] mx-auto flex items-center justify-end gap-3 px-6 py-3">
          <Button variant="cento" size="sm" onClick={handleDispatch}><SendHorizonal className="h-3.5 w-3.5 mr-1" /> Dispatch</Button>
        </div>
      </div>
    </div>
  );
}

// Dispatch Detail page (viewing existing dispatch)
export default function ViewDispatchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDispatch, updateDispatchStatus } = useDispatchStore();

  const dispatch = id ? getDispatch(id) : undefined;

  if (!dispatch) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">Dispatch not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/operations/dispatches")}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1000px] pb-28">
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Dispatch Details</CardTitle>
            <Badge variant="outline" className={`text-xs px-3 py-1 ${dispatch.status === "Closed" ? "border-green-200 text-green-700 bg-green-50" : dispatch.status === "Closed (Partial)" ? "border-blue-200 text-blue-700 bg-blue-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>{dispatch.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">GDN ID</p><p className="text-sm font-semibold text-primary">{dispatch.id}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Purchase ID</p><p className="text-sm font-medium">{dispatch.requisitionId}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Deliver To</p><p className="text-sm">{dispatch.deliverTo}</p></div>
            <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Dispatch Date</p><p className="text-sm text-muted-foreground">{dispatch.dispatchDate}</p></div>
            {dispatch.grnId && <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">GRN ID</p><p className="text-sm">{dispatch.grnId}</p></div>}
            {dispatch.invoiceId && <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Invoice ID</p><p className="text-sm">{dispatch.invoiceId}</p></div>}
            {dispatch.invoiceAmount && <div><p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Invoice Amount</p><p className="text-sm">{fmt(dispatch.invoiceAmount)}</p></div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Materials</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Dispatch Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatch.materials.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell className="text-right">{m.dispatchQty}</TableCell>
                  <TableCell className="text-right">{fmt(m.unitPrice)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.taxPct > 0 ? `GST ${m.taxPct}%` : "—"}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{fmt(m.lineTotal + m.lineTotal * m.taxPct / 100)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{fmt(dispatch.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Tax</span><span>{fmt(dispatch.totalTax)}</span></div>
            <Separator />
            <div className="flex justify-between"><span className="text-sm font-semibold">Grand Total</span><span className="text-lg font-bold">{fmt(dispatch.grandTotal)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
