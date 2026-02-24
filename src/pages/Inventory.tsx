import { useState, useMemo } from "react";
import { Search, DollarSign, AlertTriangle, Unlink, ShoppingCart, Eye, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const MOCK_OUTLETS = ["Main Kitchen", "Branch - Indiranagar", "Branch - Koramangala", "Central Warehouse"];

const MOCK_INVENTORY = [
  { id: "RM-001", name: "Basmati Rice", category: "Grains", unit: "KG", avgCost: 85, avgTaxExcl: 78, availableStock: 120 },
  { id: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", unit: "LTR", avgCost: 420, avgTaxExcl: 390, availableStock: 45 },
  { id: "RM-003", name: "Chicken Breast", category: "Meat", unit: "KG", avgCost: 260, avgTaxExcl: 240, availableStock: 30 },
  { id: "RM-004", name: "Onion (Red)", category: "Vegetables", unit: "KG", avgCost: 35, avgTaxExcl: 32, availableStock: 200 },
  { id: "RM-005", name: "Tomato Paste", category: "Sauces", unit: "KG", avgCost: 180, avgTaxExcl: 165, availableStock: 25 },
  { id: "RM-006", name: "Cumin Powder", category: "Spices", unit: "KG", avgCost: 350, avgTaxExcl: 320, availableStock: 8 },
  { id: "RM-007", name: "Mozzarella Cheese", category: "Dairy", unit: "KG", avgCost: 480, avgTaxExcl: 440, availableStock: 15 },
  { id: "RM-008", name: "All-Purpose Flour", category: "Grains", unit: "KG", avgCost: 42, avgTaxExcl: 38, availableStock: 90 },
  { id: "RM-009", name: "Garlic", category: "Vegetables", unit: "KG", avgCost: 120, avgTaxExcl: 110, availableStock: 18 },
  { id: "RM-010", name: "Ginger", category: "Vegetables", unit: "KG", avgCost: 95, avgTaxExcl: 88, availableStock: 12 },
  { id: "RM-011", name: "Salmon Fillet", category: "Seafood", unit: "KG", avgCost: 1200, avgTaxExcl: 1100, availableStock: 5 },
  { id: "RM-012", name: "Cinnamon Sticks", category: "Spices", unit: "KG", avgCost: 620, avgTaxExcl: 570, availableStock: 3 },
];

const CATEGORIES = ["All", "Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood"];

type ActivityEvent = { date: string; event: string; qty: number; before: number; after: number; unit: string; batch: string; ref: string; refLabel: string; };

const genActivities = (materialId: string): Record<string, ActivityEvent[]> => ({
  procurements: [
    { date: "2026-02-20 10:30", event: "Purchase Raised", qty: 50, before: 70, after: 70, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "PO-1001", refLabel: "View PO" },
    { date: "2026-02-18 14:15", event: "Purchase Approved", qty: 50, before: 70, after: 70, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "PO-1001", refLabel: "View PO" },
    { date: "2026-02-15 09:00", event: "Receiving Raised", qty: 50, before: 70, after: 120, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "GRN-201", refLabel: "View GRN" },
    { date: "2026-02-14 16:45", event: "Receiving Closed", qty: 50, before: 120, after: 120, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "GRN-201", refLabel: "View GRN" },
  ],
  movement: [
    { date: "2026-02-19 11:00", event: "Dispatch Created", qty: 20, before: 120, after: 100, unit: "KG", batch: "BN-101 / 20 / 2026-06-20", ref: "GDN-301", refLabel: "View GDN" },
    { date: "2026-02-17 08:30", event: "Dispatch Closed", qty: 20, before: 100, after: 100, unit: "KG", batch: "BN-101 / 20 / 2026-06-20", ref: "GDN-301", refLabel: "View GDN" },
    { date: "2026-02-16 13:20", event: "Transfer Raised", qty: 10, before: 100, after: 90, unit: "KG", batch: "BN-101 / 10 / 2026-06-20", ref: "TO-401", refLabel: "View STN" },
    { date: "2026-02-13 10:00", event: "Production Logged", qty: 5, before: 90, after: 85, unit: "KG", batch: "BN-101 / 5 / 2026-06-20", ref: "PRN-501", refLabel: "View PRN" },
  ],
  consumed: [
    { date: "2026-02-21 20:30", event: "Consumed", qty: 3, before: 123, after: 120, unit: "KG", batch: "BN-101 / 3 / 2026-06-20", ref: "-", refLabel: "" },
    { date: "2026-02-20 21:15", event: "Consumed", qty: 2, before: 122, after: 120, unit: "KG", batch: "BN-101 / 2 / 2026-06-20", ref: "-", refLabel: "" },
  ],
  audits: [
    { date: "2026-02-10 09:00", event: "AUDIT", qty: 0, before: 120, after: 118, unit: "KG", batch: "-", ref: "AUD-001", refLabel: "View Audit" },
    { date: "2026-02-05 11:30", event: "Wastage", qty: 2, before: 120, after: 118, unit: "KG", batch: "-", ref: "WTG-001", refLabel: "View Wastage" },
  ],
});

const TRANSACTION_EVENTS: Record<string, string[]> = {
  procurements: ["All", "Purchase Raised", "Purchase Approved", "Receiving Raised", "Receiving Closed"],
  movement: ["All", "Dispatch Created", "Dispatch Closed", "Transfer Raised", "Transfer Approved", "Production Logged"],
  consumed: ["All", "Consumed"],
  audits: ["All", "AUDIT", "Wastage"],
};

function ActivityTable({ events, tab }: { events: ActivityEvent[]; tab: string }) {
  const [eventFilter, setEventFilter] = useState("All");
  const filtered = eventFilter === "All" ? events : events.filter((e) => e.event === eventFilter);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="Transaction Event" /></SelectTrigger>
          <SelectContent>{TRANSACTION_EVENTS[tab]?.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs">Date & Time</TableHead>
              <TableHead className="text-xs">Transaction Event</TableHead>
              <TableHead className="text-xs text-right">Txn Qty</TableHead>
              <TableHead className="text-xs text-right">Before</TableHead>
              <TableHead className="text-xs text-right">After</TableHead>
              <TableHead className="text-xs">Unit</TableHead>
              <TableHead className="text-xs">BN / QN / Exp</TableHead>
              <TableHead className="text-xs">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">No activity recorded.</TableCell></TableRow>
            ) : filtered.map((e, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs text-muted-foreground">{e.date}</TableCell>
                <TableCell className="text-xs font-medium">{e.event}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{e.qty}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{e.before}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">{e.after}</TableCell>
                <TableCell className="text-xs">{e.unit}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.batch}</TableCell>
                <TableCell>{e.refLabel ? <button className="text-xs text-primary font-medium hover:underline">{e.refLabel}</button> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [outlet, setOutlet] = useState(MOCK_OUTLETS[0]);
  const [activityMaterial, setActivityMaterial] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return MOCK_INVENTORY.filter((m) => {
      if (categoryFilter !== "All" && m.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, categoryFilter]);

  const totalStockValue = MOCK_INVENTORY.reduce((s, m) => s + m.avgCost * m.availableStock, 0);
  const lowStockCount = MOCK_INVENTORY.filter((m) => m.availableStock < 10).length;
  const notLinkedCount = 3;
  const totalProcurements = 24;

  const activeMaterial = MOCK_INVENTORY.find((m) => m.id === activityMaterial);
  const activities = activityMaterial ? genActivities(activityMaterial) : null;

  const cards = [
    { label: "Current Stock Value", value: `₹${totalStockValue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    { label: "Low Stock Materials", value: lowStockCount, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
    { label: "Not Linked to Recipe", value: notLinkedCount, icon: Unlink, color: "text-rose-600 bg-rose-50" },
    { label: "Total Procurements", value: totalProcurements, icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
  ];

  return (
    <div className="space-y-5 max-w-[1200px]">
      {/* Cards */}
      <div className="grid grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="cento-card flex items-center gap-4 p-5">
            <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", c.color)}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search inventory..." className="pl-8 h-9 text-xs bg-card" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 h-9 text-xs bg-card"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Select value={outlet} onValueChange={setOutlet}>
          <SelectTrigger className="w-56 h-9 text-xs bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{MOCK_OUTLETS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Material ID</TableHead>
              <TableHead>Material Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Avg Cost/Unit</TableHead>
              <TableHead className="text-right">Avg Tax Excl. Cost</TableHead>
              <TableHead className="text-right">Available Stock</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead className="w-[60px]">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No materials found.</TableCell></TableRow>
            ) : filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                <TableCell className="font-medium text-primary">{m.name}</TableCell>
                <TableCell>{m.category}</TableCell>
                <TableCell>{m.unit}</TableCell>
                <TableCell className="text-right tabular-nums">₹{m.avgCost}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">₹{m.avgTaxExcl}</TableCell>
                <TableCell className="text-right tabular-nums">{m.availableStock}</TableCell>
                <TableCell className="text-right tabular-nums font-medium">₹{(m.avgCost * m.availableStock).toLocaleString()}</TableCell>
                <TableCell>
                  <button onClick={() => setActivityMaterial(m.id)} className="p-1.5 rounded hover:bg-muted/60 transition-colors" title="View Activity">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Activity Sheet */}
      <Sheet open={!!activityMaterial} onOpenChange={(open) => !open && setActivityMaterial(null)}>
        <SheetContent className="sm:max-w-[700px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span>Activity Log</span>
              {activeMaterial && <span className="text-sm font-normal text-muted-foreground">— {activeMaterial.name} ({activeMaterial.id})</span>}
            </SheetTitle>
          </SheetHeader>
          {activities && (
            <Tabs defaultValue="procurements" className="mt-4">
              <TabsList className="w-full justify-start bg-muted/40 h-9">
                <TabsTrigger value="procurements" className="text-xs">Stock Procurements</TabsTrigger>
                <TabsTrigger value="movement" className="text-xs">Stock Movement</TabsTrigger>
                <TabsTrigger value="consumed" className="text-xs">Stock Consumed</TabsTrigger>
                <TabsTrigger value="audits" className="text-xs">Audits & Wastages</TabsTrigger>
              </TabsList>
              <TabsContent value="procurements"><ActivityTable events={activities.procurements} tab="procurements" /></TabsContent>
              <TabsContent value="movement"><ActivityTable events={activities.movement} tab="movement" /></TabsContent>
              <TabsContent value="consumed"><ActivityTable events={activities.consumed} tab="consumed" /></TabsContent>
              <TabsContent value="audits"><ActivityTable events={activities.audits} tab="audits" /></TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
