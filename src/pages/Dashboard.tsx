import { useState, useMemo } from "react";
import {
  BarChart3, Zap, Package, FileText, Building2, AlertTriangle, X, ArrowUpRight, ArrowDownRight,
  Info, Truck, CheckCircle, ClipboardCheck, Factory, RefreshCw, TrendingUp, Clock, CreditCard,
  DollarSign, Search, Eye, Filter, Unlink, ShoppingCart,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ─── MOCK DATA ───────────────────────────────────────────────── */

const OUTLETS = ["All Outlets", "Main Kitchen", "Branch - Indiranagar", "Branch - Koramangala", "Central Warehouse"];

// Alerts
type AlertLevel = "critical" | "warning";
interface DashAlert { id: string; level: AlertLevel; message: string; cta: string; link: string; }
const ALL_ALERTS: DashAlert[] = [
  { id: "a1", level: "critical", message: "Basmati Rice stock below PAR at Branch - Indiranagar", cta: "View Inventory", link: "/dashboard" },
  { id: "a2", level: "critical", message: "PO-1042 pending approval for over 24 hours", cta: "Review PO", link: "/procurements/purchases" },
  { id: "a3", level: "critical", message: "Dry Store Audit overdue at Main Kitchen", cta: "Start Audit", link: "/audits/new" },
  { id: "a4", level: "warning", message: "Wastage at 6.2% — exceeds 5% threshold", cta: "View Wastage", link: "/wastage" },
  { id: "a5", level: "warning", message: "Price variance detected on Chicken Breast (Fresh Farms)", cta: "View Supplier", link: "/entities/vendors" },
];

// Inventory (with parMin)
const MOCK_INVENTORY = [
  { id: "RM-001", name: "Basmati Rice", category: "Grains", unit: "KG", avgCost: 85, avgTaxExcl: 78, availableStock: 120, parMin: 50 },
  { id: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", unit: "LTR", avgCost: 420, avgTaxExcl: 390, availableStock: 45, parMin: 30 },
  { id: "RM-003", name: "Chicken Breast", category: "Meat", unit: "KG", avgCost: 260, avgTaxExcl: 240, availableStock: 30, parMin: 40 },
  { id: "RM-004", name: "Onion (Red)", category: "Vegetables", unit: "KG", avgCost: 35, avgTaxExcl: 32, availableStock: 200, parMin: 100 },
  { id: "RM-005", name: "Tomato Paste", category: "Sauces", unit: "KG", avgCost: 180, avgTaxExcl: 165, availableStock: 25, parMin: 20 },
  { id: "RM-006", name: "Cumin Powder", category: "Spices", unit: "KG", avgCost: 350, avgTaxExcl: 320, availableStock: 8, parMin: 15 },
  { id: "RM-007", name: "Mozzarella Cheese", category: "Dairy", unit: "KG", avgCost: 480, avgTaxExcl: 440, availableStock: 15, parMin: 20 },
  { id: "RM-008", name: "All-Purpose Flour", category: "Grains", unit: "KG", avgCost: 42, avgTaxExcl: 38, availableStock: 90, parMin: 50 },
  { id: "RM-009", name: "Garlic", category: "Vegetables", unit: "KG", avgCost: 120, avgTaxExcl: 110, availableStock: 18, parMin: 10 },
  { id: "RM-010", name: "Ginger", category: "Vegetables", unit: "KG", avgCost: 95, avgTaxExcl: 88, availableStock: 12, parMin: 10 },
  { id: "RM-011", name: "Salmon Fillet", category: "Seafood", unit: "KG", avgCost: 1200, avgTaxExcl: 1100, availableStock: 5, parMin: 10 },
  { id: "RM-012", name: "Cinnamon Sticks", category: "Spices", unit: "KG", avgCost: 620, avgTaxExcl: 570, availableStock: 3, parMin: 5 },
];
const CATEGORIES = ["All", "Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood"];

type ActivityEvent = { date: string; event: string; qty: number; before: number; after: number; unit: string; batch: string; ref: string; refLabel: string };
const genActivities = (_id: string): Record<string, ActivityEvent[]> => ({
  procurements: [
    { date: "2026-02-20 10:30", event: "Purchase Raised", qty: 50, before: 70, after: 70, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "PO-1001", refLabel: "View PO" },
    { date: "2026-02-18 14:15", event: "Purchase Approved", qty: 50, before: 70, after: 70, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "PO-1001", refLabel: "View PO" },
    { date: "2026-02-15 09:00", event: "Receiving Raised", qty: 50, before: 70, after: 120, unit: "KG", batch: "BN-101 / 50 / 2026-06-20", ref: "GRN-201", refLabel: "View GRN" },
  ],
  movement: [
    { date: "2026-02-19 11:00", event: "Dispatch Created", qty: 20, before: 120, after: 100, unit: "KG", batch: "BN-101 / 20 / 2026-06-20", ref: "GDN-301", refLabel: "View GDN" },
    { date: "2026-02-17 08:30", event: "Dispatch Closed", qty: 20, before: 100, after: 100, unit: "KG", batch: "BN-101 / 20 / 2026-06-20", ref: "GDN-301", refLabel: "View GDN" },
  ],
  consumed: [
    { date: "2026-02-21 20:30", event: "Consumed", qty: 3, before: 123, after: 120, unit: "KG", batch: "BN-101 / 3 / 2026-06-20", ref: "-", refLabel: "" },
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

// Invoices
const MOCK_INVOICES = [
  { id: "INV-2601", vendor: "Fresh Farms Pvt Ltd", grn: "GRN-201", date: "2026-03-12", amount: 24500, tax: 4410, status: "Pending" as const },
  { id: "INV-2602", vendor: "Metro Spices", grn: "GRN-202", date: "2026-03-10", amount: 18200, tax: 3276, status: "Approved" as const },
  { id: "INV-2603", vendor: "Coastal Seafood Co", grn: "GRN-203", date: "2026-03-08", amount: 16400, tax: 2952, status: "Exported" as const },
  { id: "INV-2604", vendor: "Dairy Best India", grn: "GRN-204", date: "2026-03-05", amount: 11300, tax: 2034, status: "Pending" as const },
];
const MOCK_CREDIT_NOTES = [
  { id: "CN-001", linked: "GDN-301 / PO-1001", vendor: "Fresh Farms Pvt Ltd", amount: 6200, reason: "Short supply — Basmati Rice", status: "Issued" as const, date: "2026-03-11" },
  { id: "CN-002", linked: "PO-1038", vendor: "Metro Spices", amount: 4100, reason: "Quality rejection — Cumin Powder", status: "Pending" as const, date: "2026-03-09" },
];

/* ─── MINI CHART ──────────────────────────────────────────────── */

function MiniAreaChart({ data, color, labels }: { data: number[]; color: string; labels: string[] }) {
  const w = 200, h = 64, px = 4, py = 8;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: px + (i / (data.length - 1)) * (w - 2 * px),
    y: py + (1 - (v - min) / range) * (h - 2 * py),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${w} ${h + 16}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#grad-${color.replace("#", "")})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />)}
        {labels.map((l, i) => (
          <text key={i} x={points[i].x} y={h + 12} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8} fontFamily="Inter">{l}</text>
        ))}
      </svg>
    </div>
  );
}

/* ─── ACTIVITY TABLE (from Inventory) ─────────────────────────── */

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

/* ─── DASHBOARD ───────────────────────────────────────────────── */

export default function Dashboard() {
  const [outlet, setOutlet] = useState("All Outlets");
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("analytics");

  // Alert banner
  const visibleAlerts = ALL_ALERTS.filter((a) => !dismissedAlerts.includes(a.id));
  const displayAlerts = visibleAlerts.slice(0, 3);
  const pendingActionsCount = 4; // approvals + overdue

  return (
    <div className="space-y-4 max-w-[1200px]">
      {/* ALERT BANNER */}
      {displayAlerts.length > 0 && (
        <div className="space-y-2">
          {displayAlerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs",
                a.level === "critical"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 font-medium">{a.message}</span>
              <Button variant="ghost" size="sm" className="h-7 px-3 text-xs font-semibold underline-offset-2 hover:underline">
                {a.cta}
              </Button>
              <button onClick={() => setDismissedAlerts((p) => [...p, a.id])} className="p-0.5 rounded hover:bg-black/5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {visibleAlerts.length > 3 && (
            <button className="text-xs text-primary font-medium hover:underline ml-1">
              View all {visibleAlerts.length} alerts
            </button>
          )}
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="cento-page-title">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Your operational and analytics command centre</p>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select value={outlet} onValueChange={setOutlet}>
            <SelectTrigger className="w-52 h-9 text-xs bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>{OUTLETS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none h-10 p-0 w-full justify-start gap-0">
          {[
            { value: "analytics", label: "Analytics", icon: BarChart3 },
            { value: "actions", label: "Actions", icon: Zap, badge: pendingActionsCount },
            { value: "inventory", label: "Inventory", icon: Package },
            { value: "accounting", label: "Accounting", icon: FileText },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className={cn(
                "rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-medium gap-1.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.badge && (
                <span className="ml-1 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold inline-flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
        <TabsContent value="actions" className="mt-4"><ActionsTab /></TabsContent>
        <TabsContent value="inventory" className="mt-4"><InventoryTab /></TabsContent>
        <TabsContent value="accounting" className="mt-4"><AccountingTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — ANALYTICS
   ═══════════════════════════════════════════════════════════════ */

function AnalyticsTab() {
  const [dateRange, setDateRange] = useState("last-30");
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  return (
    <div className="space-y-6">
      {/* Date range */}
      <div className="flex items-center justify-between">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-44 h-9 text-xs bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last-7">Last 7 Days</SelectItem>
            <SelectItem value="last-30">Last 30 Days</SelectItem>
            <SelectItem value="last-90">Last 90 Days</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[11px] text-muted-foreground">Showing data for all outlets</span>
      </div>

      {/* PROFITABILITY */}
      <SectionHeader title="Profitability" subtitle="Cost of goods and wastage metrics" />
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="COGS %" value="31.4%" sub="₹4,82,000" delta={1.2} bad />
        <MetricCard label="COGD %" value="34.1%" sub="₹5,23,200" delta={0.8} bad />
        <MetricCard label="Total Revenue" value="₹15,34,000" delta={12.3} />
        <MetricCard label="Wastage %" value="6.2%" sub="₹95,108" delta={1.4} bad alert />
        <MetricCard label="Wastage Cost" value="₹95,108" delta={-3.1} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <TrendCard label="COGS % Trend" value="31.4%" data={[28.1, 29.4, 30.2, 31.8, 30.5, 31.4]} color="#3B82F6" months={months} />
        <TrendCard label="COGD % Trend" value="34.1%" data={[30.4, 31.2, 32.8, 34.5, 33.1, 34.1]} color="#8B5CF6" months={months} />
        <TrendCard label="Wastage % Trend" value="6.2%" data={[4.1, 4.8, 5.2, 5.9, 5.5, 6.2]} color="#EF4444" months={months} />
      </div>

      {/* AUDIT & COMPLIANCE */}
      <SectionHeader title="Audit & Compliance" />
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="Audits Conducted" value="12" delta={2} deltaAbs />
        <MetricCard label="Variance Amount" value="₹28,400" delta={-4.2} />
        <MetricCard label="Variance %" value="2.4%" delta={0.3} bad />
        <div className="cento-card flex flex-col justify-between">
          <p className="text-[11px] text-muted-foreground">Returned Amount</p>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1"><Info className="h-3 w-3" /> Data unavailable</p>
          <p className="text-[10px] text-muted-foreground mt-1">DB source TBD</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TrendCard label="Audits Trend" value="12" data={[8, 10, 9, 11, 10, 12]} color="#6366F1" months={months} />
        <TrendCard label="Variance Trend" value="₹28,400" data={[22000, 25000, 31000, 28000, 30000, 28400]} color="#F59E0B" months={months} />
      </div>

      {/* MENU MIX */}
      <SectionHeader title="Menu Mix" subtitle="Requires POS integration" />
      <div className="grid grid-cols-2 gap-4">
        {/* Quadrant */}
        <div className="cento-card p-4">
          <p className="text-xs font-semibold mb-3">Sales vs Profitability Quadrant</p>
          <div className="relative border border-dashed border-border rounded-lg" style={{ height: 240 }}>
            <div className="absolute inset-0 flex">
              <div className="w-1/2 h-1/2 border-r border-b border-dashed border-border" />
              <div className="w-1/2 h-1/2 border-b border-dashed border-border" />
            </div>
            <div className="absolute inset-0 flex flex-wrap">
              <div className="w-1/2 h-1/2" /><div className="w-1/2 h-1/2" />
              <div className="w-1/2 h-1/2" /><div className="w-1/2 h-1/2" />
            </div>
            {/* Labels */}
            <span className="absolute top-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Puzzles</span>
            <span className="absolute top-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">Stars ⭐</span>
            <span className="absolute bottom-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-700">Dogs</span>
            <span className="absolute bottom-2 right-2 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Plowhorses</span>
            {/* Dots */}
            {[
              { x: 70, y: 30, c: "#22c55e", n: "Margherita Pizza" },
              { x: 80, y: 25, c: "#22c55e", n: "Grilled Chicken" },
              { x: 25, y: 35, c: "#f59e0b", n: "Truffle Pasta" },
              { x: 30, y: 75, c: "#ef4444", n: "Garlic Bread" },
              { x: 75, y: 70, c: "#3b82f6", n: "Caesar Salad" },
              { x: 60, y: 50, c: "#8b5cf6", n: "Fish & Chips" },
            ].map((d, i) => (
              <div key={i} className="absolute group" style={{ left: `${d.x}%`, top: `${d.y}%`, transform: "translate(-50%,-50%)" }}>
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.c }} />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-foreground text-background text-[9px] px-2 py-0.5 rounded whitespace-nowrap z-10">
                  {d.n}
                </div>
              </div>
            ))}
            <p className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">← Sales Volume →</p>
            <p className="absolute left-[-22px] top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-muted-foreground whitespace-nowrap">← Margin % →</p>
          </div>
        </div>

        {/* Food cost bars */}
        <div className="cento-card p-4">
          <p className="text-xs font-semibold mb-3">Category Food Cost %</p>
          <div className="space-y-2.5">
            {[
              { cat: "Seafood", pct: 42, color: "bg-red-500" },
              { cat: "Meat", pct: 38, color: "bg-amber-500" },
              { cat: "Dairy", pct: 31, color: "bg-amber-300" },
              { cat: "Oils", pct: 26, color: "bg-yellow-400" },
              { cat: "Grains", pct: 18, color: "bg-emerald-500" },
              { cat: "Vegetables", pct: 14, color: "bg-emerald-700" },
            ].map((b) => (
              <div key={b.cat} className="flex items-center gap-3">
                <span className="text-xs w-20 text-right text-muted-foreground">{b.cat}</span>
                <div className="flex-1 bg-muted/50 rounded-full h-5 overflow-hidden">
                  <div className={cn("h-full rounded-full flex items-center justify-end pr-2", b.color)} style={{ width: `${b.pct}%` }}>
                    <span className="text-[10px] font-bold text-white">{b.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUPPLIER PERFORMANCE */}
      <div className="flex items-center justify-between">
        <SectionHeader title="Supplier Performance" />
        <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
          {["Day", "Week", "Month"].map((g) => (
            <button key={g} className={cn("px-3 py-1 text-[11px] font-medium", g === "Month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/60")}>
              {g}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Price drift */}
        <div className="cento-card p-0 overflow-hidden">
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
            <p className="text-xs font-semibold">Top Items by Price Drift</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Item</TableHead>
                <TableHead className="text-xs">Supplier</TableHead>
                <TableHead className="text-xs text-right">Min</TableHead>
                <TableHead className="text-xs text-right">Max</TableHead>
                <TableHead className="text-xs text-right">Drift %</TableHead>
                <TableHead className="text-xs text-right">GRNs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { item: "Chicken Breast", supplier: "Fresh Farms", min: 240, max: 290, drift: 20.8, grns: 6 },
                { item: "Salmon Fillet", supplier: "Coastal Seafood", min: 1080, max: 1260, drift: 16.7, grns: 4 },
                { item: "Olive Oil", supplier: "Euro Imports", min: 380, max: 435, drift: 14.5, grns: 5 },
                { item: "Mozzarella", supplier: "Dairy Best", min: 420, max: 480, drift: 14.3, grns: 3 },
                { item: "Cumin Powder", supplier: "Metro Spices", min: 340, max: 350, drift: 2.9, grns: 2 },
              ].map((r) => (
                <TableRow key={r.item}>
                  <TableCell className="text-xs font-medium">{r.item}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.supplier}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">₹{r.min}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">₹{r.max}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-bold text-red-600">{r.drift}%</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{r.grns}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Supplier drift score */}
        <div className="cento-card p-0 overflow-hidden">
          <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
            <p className="text-xs font-semibold">Top Suppliers by Drift Score</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Supplier</TableHead>
                <TableHead className="text-xs text-right">Items</TableHead>
                <TableHead className="text-xs text-right">Avg Drift</TableHead>
                <TableHead className="text-xs text-right">{">5%"}</TableHead>
                <TableHead className="text-xs text-right">Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { supplier: "Fresh Farms Pvt Ltd", items: 8, avg: 14.2, over5: 3, fulfill: 92 },
                { supplier: "Coastal Seafood Co", items: 4, avg: 11.8, over5: 2, fulfill: 96 },
                { supplier: "Euro Imports", items: 3, avg: 9.4, over5: 1, fulfill: 98 },
                { supplier: "Metro Spices", items: 6, avg: 3.1, over5: 0, fulfill: 88 },
              ].map((r) => (
                <TableRow key={r.supplier}>
                  <TableCell className="text-xs font-medium">{r.supplier}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{r.items}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums font-bold text-red-600">{r.avg}%</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">{r.over5}</TableCell>
                  <TableCell className={cn("text-xs text-right tabular-nums font-semibold", r.fulfill >= 95 ? "text-emerald-600" : r.fulfill >= 90 ? "text-amber-600" : "text-red-600")}>
                    {r.fulfill}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — ACTIONS
   ═══════════════════════════════════════════════════════════════ */

function ActionsTab() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Pending */}
      <div className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Pending Actions</h3>
          <p className="text-[11px] text-muted-foreground">Actions requiring your attention right now</p>
        </div>

        <ActionGroup icon={Truck} label="RESPOND TO RECEIVINGS" count={2} color="blue">
          <ActionCard title="Receive incoming dispatch" sub="From Central Warehouse • Basmati Rice, Chicken Breast" cta="Receive" ctaVariant="cento" />
          <ActionCard title="Receive incoming transfer" sub="From Main Kitchen • Olive Oil, Cumin Powder" cta="Receive" ctaVariant="cento" />
        </ActionGroup>

        <ActionGroup icon={CheckCircle} label="APPROVE REQUESTS" count={3} color="emerald">
          <ActionCard title="Approve Purchase Order" sub="Raised by Ravi Kumar • ₹24,500 • Fresh Farms Pvt Ltd" cta="Review" ctaVariant="dark" />
          <ActionCard title="Approve Transfer Order" sub="Raised by Priya Nair • Branch - Koramangala → Main Kitchen" cta="Review" ctaVariant="dark" />
          <ActionCard title="Approve Wastage Log" sub="Raised by Arjun Singh • 3 materials • ₹4,200" cta="Review" ctaVariant="dark" />
        </ActionGroup>

        <ActionGroup icon={ClipboardCheck} label="OVERDUE AUDITS" count={1} color="red">
          <ActionCard title="Dry Store Audit Overdue" sub="Scheduled weekly • 2 days overdue • Main Kitchen" cta="Start Audit" ctaVariant="red" urgent />
        </ActionGroup>

        <ActionGroup icon={Factory} label="SCHEDULED PRODUCTIONS" count={2} color="purple">
          <ActionCard title="Produce: Bechamel Sauce" sub="Scheduled today • 40 LTR • Main Kitchen" cta="Log Production" ctaVariant="purple" />
          <ActionCard title="Produce: Pizza Dough Base" sub="Scheduled today • 25 KG • Branch - Koramangala" cta="Log Production" ctaVariant="purple" />
        </ActionGroup>
      </div>

      {/* Suggested */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Suggested Actions</h3>
              <p className="text-[11px] text-muted-foreground">AI-generated based on current inventory and operations</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>

        {[
          { icon: Package, bg: "bg-red-100 text-red-600", title: "Reorder Basmati Rice", desc: "Stock at 15% of PAR level at Branch - Indiranagar. Last ordered 8 days ago.", cta: "New PO →" },
          { icon: TrendingUp, bg: "bg-amber-100 text-amber-600", title: "Fresh Farms raised prices 3× in 30 days", desc: "Avg price drift 14.2% — consider renegotiation or alternate supplier.", cta: "View Supplier →" },
          { icon: AlertTriangle, bg: "bg-amber-100 text-amber-600", title: "Wastage up 22% vs last week", desc: "Chicken Breast and Salmon Fillet are the top contributors at Main Kitchen.", cta: "View Wastage →" },
          { icon: ClipboardCheck, bg: "bg-blue-100 text-blue-600", title: "3 POs pending approval > 24hrs", desc: "PO-1042, PO-1038, PO-1035 are awaiting Site Manager approval.", cta: "View POs →" },
          { icon: Clock, bg: "bg-purple-100 text-purple-600", title: "Dry Store Audit overdue by 2 days", desc: "Weekly audit cycle missed at Main Kitchen. Last audit: 12 Feb 2026.", cta: "Start Audit →" },
        ].map((s, i) => (
          <div key={i} className="cento-card flex items-start gap-3 p-3.5">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-tight">{s.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
            <button className="text-xs text-primary font-medium whitespace-nowrap hover:underline shrink-0 mt-0.5">{s.cta}</button>
          </div>
        ))}

        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40 rounded-lg">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-[11px] text-muted-foreground">Suggestions are rule-based in Phase 1. ML-powered pattern recognition in Phase 2.</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — INVENTORY (copied from Inventory.tsx with parMin)
   ═══════════════════════════════════════════════════════════════ */

function InventoryTab() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [invOutlet, setInvOutlet] = useState("Main Kitchen");
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
  const lowStockCount = MOCK_INVENTORY.filter((m) => m.availableStock < m.parMin).length;
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
    <div className="space-y-5">
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
        <Select value={invOutlet} onValueChange={setInvOutlet}>
          <SelectTrigger className="w-56 h-9 text-xs bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{OUTLETS.slice(1).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="cento-card p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-xs">Material ID</TableHead>
              <TableHead className="text-xs">Material Name</TableHead>
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Unit</TableHead>
              <TableHead className="text-xs text-right">Avg Cost/Unit</TableHead>
              <TableHead className="text-xs text-right">Avg Tax Excl. Cost</TableHead>
              <TableHead className="text-xs text-right">Available Stock</TableHead>
              <TableHead className="text-xs text-right">Stock Value</TableHead>
              <TableHead className="text-xs w-[60px]">Activity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No materials found.</TableCell></TableRow>
            ) : filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{m.id}</TableCell>
                <TableCell className="font-medium text-primary text-xs">{m.name}</TableCell>
                <TableCell className="text-xs">{m.category}</TableCell>
                <TableCell className="text-xs">{m.unit}</TableCell>
                <TableCell className="text-xs text-right tabular-nums">₹{m.avgCost}</TableCell>
                <TableCell className="text-xs text-right tabular-nums text-muted-foreground">₹{m.avgTaxExcl}</TableCell>
                <TableCell className={cn("text-xs text-right tabular-nums", m.availableStock < m.parMin && "bg-amber-50 text-amber-700 font-semibold")}>
                  {m.availableStock}
                </TableCell>
                <TableCell className="text-xs text-right tabular-nums font-medium">₹{(m.avgCost * m.availableStock).toLocaleString()}</TableCell>
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

/* ═══════════════════════════════════════════════════════════════
   TAB 4 — ACCOUNTING
   ═══════════════════════════════════════════════════════════════ */

function AccountingTab() {
  const [subTab, setSubTab] = useState<"invoices" | "credits">("invoices");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const filteredInvoices = statusFilter === "All" ? MOCK_INVOICES : MOCK_INVOICES.filter((i) => i.status === statusFilter);

  const toggleInvoice = (id: string) => {
    setSelectedInvoices((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  };

  const summaryCards = [
    { label: "Total Invoice Amount (MTD)", value: "₹70,400", icon: FileText, color: "text-blue-600 bg-blue-50" },
    { label: "Total Tax Paid (MTD)", value: "₹12,672", icon: DollarSign, color: "text-purple-600 bg-purple-50" },
    { label: "Pending Invoices", value: "4", icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Credit Notes (MTD)", value: "₹10,300", icon: CreditCard, color: "text-emerald-600 bg-emerald-50" },
  ];

  const statusBadge = (s: string) => {
    const m: Record<string, string> = {
      Pending: "bg-amber-50 text-amber-700 border-amber-200",
      Approved: "bg-blue-50 text-blue-700 border-blue-200",
      Exported: "bg-emerald-50 text-emerald-700 border-emerald-200",
      Issued: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", m[s] || "")}>{s}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="cento-card flex items-center gap-4 p-4">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", c.color)}>
              <c.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{c.label}</p>
              <p className="text-base font-bold text-foreground mt-0.5">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {(["invoices", "credits"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              "px-4 py-2 text-xs font-medium border-b-2 -mb-px",
              subTab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "invoices" ? "Invoices" : "Credit Notes"}
          </button>
        ))}
      </div>

      {subTab === "invoices" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9 text-xs bg-card"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["All", "Pending", "Approved", "Exported"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            {selectedInvoices.length > 0 ? (
              <Button variant="cento" size="sm" className="text-xs">Export {selectedInvoices.length} Selected</Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Export to:</span>
                {["Zoho Books", "Tally", "Xero", "CSV"].map((e) => (
                  <button key={e} className="text-[11px] px-2.5 py-1 border border-border rounded-md hover:border-primary transition-colors">{e}</button>
                ))}
              </div>
            )}
          </div>

          <div className="cento-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-8"><Checkbox /></TableHead>
                  <TableHead className="text-xs">Invoice ID</TableHead>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs">GRN</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">Tax</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Checkbox checked={selectedInvoices.includes(inv.id)} onCheckedChange={() => toggleInvoice(inv.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary font-semibold">{inv.id}</TableCell>
                    <TableCell className="text-xs">{inv.vendor}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.grn}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{inv.date}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums text-muted-foreground">₹{inv.tax.toLocaleString()}</TableCell>
                    <TableCell>{statusBadge(inv.status)}</TableCell>
                    <TableCell><button className="text-xs text-primary font-medium hover:underline">View</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {subTab === "credits" && (
        <div className="space-y-3">
          <div className="cento-card p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs">Credit Note ID</TableHead>
                  <TableHead className="text-xs">Linked GDN/PO</TableHead>
                  <TableHead className="text-xs">Vendor</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_CREDIT_NOTES.map((cn) => (
                  <TableRow key={cn.id}>
                    <TableCell className="font-mono text-xs text-primary font-semibold">{cn.id}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cn.linked}</TableCell>
                    <TableCell className="text-xs">{cn.vendor}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">₹{cn.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cn.reason}</TableCell>
                    <TableCell>{statusBadge(cn.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{cn.date}</TableCell>
                    <TableCell><button className="text-xs text-primary font-medium hover:underline">View</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-2 border-dashed border-border rounded-xl py-8 text-center">
            <p className="text-xs text-muted-foreground">SOA Reconciliation — Phase 2</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SHARED COMPONENTS ───────────────────────────────────────── */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function MetricCard({ label, value, sub, delta, bad, alert: isAlert, deltaAbs }: {
  label: string; value: string; sub?: string; delta: number; bad?: boolean; alert?: boolean; deltaAbs?: boolean;
}) {
  const isDown = delta < 0;
  const isGood = bad ? isDown : !isDown;
  const Arrow = isDown ? ArrowDownRight : ArrowUpRight;
  return (
    <div className={cn("cento-card relative", isAlert && "border-red-200 ring-1 ring-red-100")}>
      {isAlert && <AlertTriangle className="h-3.5 w-3.5 text-red-500 absolute top-3 right-3" />}
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-bold mt-1", isAlert && "text-red-600")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      <div className={cn("inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", isGood ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
        <Arrow className="h-3 w-3" />
        {deltaAbs ? `${Math.abs(delta)}` : `${Math.abs(delta)}%`}
      </div>
    </div>
  );
}

function TrendCard({ label, value, data, color, months }: { label: string; value: string; data: number[]; color: string; months: string[] }) {
  return (
    <div className="cento-card">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-bold mt-0.5">{value}</p>
      <div className="mt-2">
        <MiniAreaChart data={data} color={color} labels={months} />
      </div>
    </div>
  );
}

function ActionGroup({ icon: Icon, label, count, color, children }: { icon: any; label: string; count: number; color: string; children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{label}</span>
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", colorMap[color])}>{count}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ActionCard({ title, sub, cta, ctaVariant, urgent }: { title: string; sub: string; cta: string; ctaVariant: string; urgent?: boolean }) {
  const btnClass: Record<string, string> = {
    cento: "bg-primary text-primary-foreground hover:bg-primary/90",
    dark: "bg-foreground text-background hover:bg-foreground/90",
    red: "bg-red-600 text-white hover:bg-red-700",
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  };
  return (
    <div className={cn(
      "flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border transition-colors hover:border-primary/30",
      urgent ? "bg-red-50/50 border-red-200" : "border-border"
    )}>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold leading-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <button className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-md shrink-0", btnClass[ctaVariant] || btnClass.cento)}>
        {cta}
      </button>
    </div>
  );
}
