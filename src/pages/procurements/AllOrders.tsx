import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal, Search, Eye, Pencil, Trash2, XCircle, Lock,
} from "lucide-react";
import { usePOStore, type PurchaseOrder, type POStatus } from "@/context/POStoreContext";

const STATUS_COLOR: Record<POStatus, string> = {
  Drafted: "bg-muted text-muted-foreground",
  Raised: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Approved: "bg-blue-50 text-blue-700 border-blue-200",
  "Partially Received": "bg-amber-50 text-amber-700 border-amber-200",
  Received: "bg-green-50 text-green-700 border-green-200",
  Closed: "bg-neutral-100 text-neutral-600 border-neutral-300",
  Rejected: "bg-red-50 text-red-600 border-red-200",
};

const TAB_KEY: Record<string, POStatus> = {
  drafted: "Drafted",
  raised: "Raised",
  approved: "Approved",
  partial: "Partially Received",
  received: "Received",
  closed: "Closed",
  rejected: "Rejected",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// Mock templates data
const MOCK_TEMPLATES = [
  { id: "t1", name: "Weekly Staples - Sysco", supplierType: "Vendor", createdBy: "Ankit", materialIds: ["m1", "m2", "m3", "m8"] },
  { id: "t2", name: "Dairy Essentials", supplierType: "Vendor", createdBy: "Meera", materialIds: ["m7"] },
  { id: "t3", name: "Fresh Produce - Branch", supplierType: "Outlet", createdBy: "Raj", materialIds: ["m4", "m9", "m10"] },
];

export default function AllOrders() {
  const navigate = useNavigate();
  const { orders, deleteOrder } = usePOStore();
  const [tab, setTab] = useState("drafted");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const activeStatus = TAB_KEY[tab];

  // Count orders per status for tab badges
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(TAB_KEY).forEach(([key, status]) => {
      counts[key] = orders.filter((o) => o.status === status).length;
    });
    return counts;
  }, [orders]);

  const rows = useMemo(() => {
    return orders.filter((r) => {
      if (r.status !== activeStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !r.vendor.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [orders, activeStatus, search]);

  const handleDelete = () => {
    if (deleteTarget) {
      deleteOrder(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleAction = (action: string, row: PurchaseOrder) => {
    switch (action) {
      case "view":
        navigate(`/procurements/all-orders/${row.id}`);
        break;
      case "edit":
        navigate("/procurements/new-purchase", { state: { editPO: row.id } });
        break;
      case "delete":
        setDeleteTarget(row);
        break;
    }
  };

  const renderColumns = () => {
    switch (tab) {
      case "drafted":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "raised":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created On</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "approved":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Approved On</TableHead>
            <TableHead>Approved By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "partial":
      case "received":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead className="text-right">Pending Qty</TableHead>
            <TableHead>Last Receiving</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "closed":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-right">Ordered Qty</TableHead>
            <TableHead className="text-right">Received Qty</TableHead>
            <TableHead>Closed Date</TableHead>
            <TableHead>Closed By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "rejected":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Supplier Type</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Rejected On</TableHead>
            <TableHead>Rejected By</TableHead>
            <TableHead className="w-[48px]" />
          </>
        );
      case "templates":
        return (
          <>
            <TableHead>Template Name</TableHead>
            <TableHead>Supplier Type</TableHead>
            <TableHead>No. of Materials</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="w-[100px]">Action</TableHead>
          </>
        );
      default:
        return null;
    }
  };

  const renderRow = (row: PurchaseOrder) => {
    const actions = getActions(tab);
    const actionMenu = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {actions.map((a) => (
            <DropdownMenuItem key={a.key} onClick={() => handleAction(a.key, row)} className={a.destructive ? "text-destructive focus:text-destructive" : ""}>
              <a.icon className="h-3.5 w-3.5 mr-2" />
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );

    switch (tab) {
      case "drafted":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell className="text-muted-foreground">{row.lastUpdated}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{actionMenu}</TableCell>
          </TableRow>
        );
      case "raised":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.createdOn}</TableCell>
            <TableCell><Badge variant="outline" className={STATUS_COLOR[row.status]}>{row.status}</Badge></TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{actionMenu}</TableCell>
          </TableRow>
        );
      case "approved":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.approvedOn ?? "—"}</TableCell>
            <TableCell>{row.approvedBy ?? "—"}</TableCell>
            <TableCell><Badge variant="outline" className={STATUS_COLOR[row.status]}>{row.status}</Badge></TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{actionMenu}</TableCell>
          </TableRow>
        );
      case "partial":
      case "received":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
            <TableCell className="text-right text-amber-600 font-medium">{row.pendingQty}</TableCell>
            <TableCell className="text-muted-foreground">{row.lastReceivingDate}</TableCell>
            <TableCell><Badge variant="outline" className={STATUS_COLOR[row.status]}>{row.status}</Badge></TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{actionMenu}</TableCell>
          </TableRow>
        );
      case "closed":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-right">{row.totalQty}</TableCell>
            <TableCell className="text-right text-emerald-700">{row.receivedQty}</TableCell>
            <TableCell className="text-muted-foreground">{row.closedDate}</TableCell>
            <TableCell>{row.closedBy}</TableCell>
            <TableCell><Badge variant="outline" className={STATUS_COLOR[row.status]}>{row.status}</Badge></TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{actionMenu}</TableCell>
          </TableRow>
        );
      case "rejected":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>
              <Badge variant="outline" className={row.supplierType === "Vendor" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}>
                {row.supplierType}
              </Badge>
            </TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell>{row.createdBy}</TableCell>
            <TableCell className="text-muted-foreground">{row.rejectedOn}</TableCell>
            <TableCell>{row.rejectedBy}</TableCell>
            <TableCell onClick={(e) => e.stopPropagation()}>{actionMenu}</TableCell>
          </TableRow>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="cento-page-title text-xl">Orders</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/procurements/new-receiving/create")}>
            <Plus className="h-4 w-4" /> Raise Receiving
          </Button>
          <Button variant="cento" onClick={() => navigate("/procurements/new-purchase")}>
            <Plus className="h-4 w-4" /> New PO+
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 h-auto gap-0.5">
          <TabsTrigger value="drafted" className="text-xs px-3 py-1.5">Drafted ({statusCounts.drafted})</TabsTrigger>
          <TabsTrigger value="raised" className="text-xs px-3 py-1.5">Raised ({statusCounts.raised})</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs px-3 py-1.5">Approved ({statusCounts.approved})</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs px-3 py-1.5">Rejected ({statusCounts.rejected})</TabsTrigger>
          <TabsTrigger value="partial" className="text-xs px-3 py-1.5">Partially Received ({statusCounts.partial})</TabsTrigger>
          <TabsTrigger value="received" className="text-xs px-3 py-1.5">Received ({statusCounts.received})</TabsTrigger>
          <TabsTrigger value="closed" className="text-xs px-3 py-1.5">Closed ({statusCounts.closed})</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs px-3 py-1.5">Templates</TabsTrigger>
        </TabsList>

        <div className="mt-3 mb-1">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by PO ID or vendor..."
              className="pl-8 h-9 text-xs bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Status tabs */}
        {Object.keys(TAB_KEY).map((key) => (
          <TabsContent key={key} value={key} className="mt-0">
            <div className="cento-card p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">{renderColumns()}</TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        No orders found in this status.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map(renderRow)
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}

        {/* Templates tab */}
        <TabsContent value="templates" className="mt-0">
          <div className="cento-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">{renderColumns()}</TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_TEMPLATES.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No templates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  MOCK_TEMPLATES.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={t.supplierType === "Vendor" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200"}>
                          {t.supplierType}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.materialIds.length}</TableCell>
                      <TableCell>{t.createdBy}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="text-xs h-7"
                          onClick={() => navigate("/procurements/new-purchase", { state: { templateId: t.id } })}>
                          Use
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft PO?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deleteTarget?.id}</span> for <span className="font-semibold">{deleteTarget?.vendor}</span> ({deleteTarget ? fmt(deleteTarget.totalValue) : ""}). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function getActions(tab: string) {
  switch (tab) {
    case "drafted":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
        { key: "edit", label: "Edit", icon: Pencil, destructive: false },
        { key: "delete", label: "Delete", icon: Trash2, destructive: true },
      ];
    case "raised":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
      ];
    case "approved":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
      ];
    case "partial":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
        { key: "close", label: "Close PO", icon: Lock, destructive: false },
      ];
    case "received":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
        { key: "close", label: "Close PO", icon: Lock, destructive: false },
      ];
    case "closed":
    case "rejected":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
      ];
    default:
      return [];
  }
}
