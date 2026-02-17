import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Closed: "bg-neutral-100 text-neutral-600 border-neutral-300",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

const TAB_KEY: Record<string, POStatus> = {
  drafted: "Drafted",
  raised: "Raised",
  approved: "Approved",
  partial: "Partially Received",
  closed: "Closed",
  cancelled: "Cancelled",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function AllOrders() {
  const navigate = useNavigate();
  const { orders, deleteOrder } = usePOStore();
  const [tab, setTab] = useState("drafted");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const activeStatus = TAB_KEY[tab];

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
      case "cancel":
        break;
      case "close":
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
      case "approved":
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
      case "partial":
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
      case "cancelled":
        return (
          <>
            <TableHead className="w-[100px]">PO ID</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Cancelled Date</TableHead>
            <TableHead>Cancelled By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[48px]" />
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
      case "approved":
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
      case "partial":
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
      case "cancelled":
        return (
          <TableRow key={row.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/procurements/all-orders/${row.id}`)}>
            <TableCell className="font-medium text-primary">{row.id}</TableCell>
            <TableCell>{row.vendor}</TableCell>
            <TableCell className="text-muted-foreground">{row.outlet}</TableCell>
            <TableCell className="text-right font-medium">{fmt(row.totalValue)}</TableCell>
            <TableCell className="text-muted-foreground">{row.cancelledDate}</TableCell>
            <TableCell>{row.cancelledBy}</TableCell>
            <TableCell><Badge variant="outline" className={STATUS_COLOR[row.status]}>{row.status}</Badge></TableCell>
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
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/60 p-1 h-auto gap-0.5">
          <TabsTrigger value="drafted" className="text-xs px-3 py-1.5">Drafted</TabsTrigger>
          <TabsTrigger value="raised" className="text-xs px-3 py-1.5">Raised</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs px-3 py-1.5">Approved</TabsTrigger>
          <TabsTrigger value="partial" className="text-xs px-3 py-1.5">Partially Received</TabsTrigger>
          <TabsTrigger value="closed" className="text-xs px-3 py-1.5">Closed</TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs px-3 py-1.5">Cancelled</TabsTrigger>
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
      </Tabs>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft PO?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. PO <span className="font-semibold">{deleteTarget?.id}</span> will be permanently removed.
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
        { key: "cancel", label: "Cancel PO", icon: XCircle, destructive: true },
      ];
    case "approved":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
        { key: "cancel", label: "Cancel PO", icon: XCircle, destructive: true },
      ];
    case "partial":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
        { key: "close", label: "Close PO", icon: Lock, destructive: false },
      ];
    case "closed":
    case "cancelled":
      return [
        { key: "view", label: "View Details", icon: Eye, destructive: false },
      ];
    default:
      return [];
  }
}
