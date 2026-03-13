import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Search, Settings as SettingsIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const MOCK_CATEGORIES = ["Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood", "Packaging", "Beverages"];
const MOCK_UNITS = ["KG", "LTR", "PCS", "GM", "ML", "DOZ", "PKT", "BOX"];

const MOCK_MATERIALS_DB = [
  { code: "RM-001", name: "Basmati Rice", category: "Grains", primaryUnit: "KG", buyingPrice: 80 },
  { code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", primaryUnit: "LTR", buyingPrice: 520 },
  { code: "RM-003", name: "Chicken Breast", category: "Meat", primaryUnit: "KG", buyingPrice: 280 },
  { code: "RM-005", name: "Tomato Paste", category: "Sauces", primaryUnit: "KG", buyingPrice: 120 },
  { code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", primaryUnit: "KG", buyingPrice: 640 },
];

const MOCK_VENDORS = ["Fresh Farms Pvt Ltd", "Spice World Trading", "Ocean Catch Seafood", "Daily Dairy Supplies"];

interface OutletRow {
  id: string;
  name: string;
  active: boolean;
  notificationEmail: string;
  lastUpdated: string;
}

interface PurchasePrefMaterial {
  code: string;
  name: string;
  category: string;
  preferredSupplier: string;
  parStock: number;
  unit: string;
  buyingPrice: number;
}

const INITIAL_OUTLETS: OutletRow[] = [
  { id: "OTL-001", name: "Main Kitchen", active: true, notificationEmail: "main@centofoods.com", lastUpdated: "10 Mar 2026" },
  { id: "OTL-002", name: "Branch - Indiranagar", active: true, notificationEmail: "indiranagar@centofoods.com", lastUpdated: "08 Mar 2026" },
  { id: "OTL-003", name: "Branch - Koramangala", active: true, notificationEmail: "koramangala@centofoods.com", lastUpdated: "05 Mar 2026" },
  { id: "OTL-004", name: "Central Warehouse", active: false, notificationEmail: "warehouse@centofoods.com", lastUpdated: "01 Mar 2026" },
];

const MOCK_LOCATIONS = [
  { label: "Indiranagar, Bengaluru", locality: "Indiranagar", city: "Bengaluru", state: "Karnataka", pin: "560038", country: "India" },
  { label: "Koramangala, Bengaluru", locality: "Koramangala", city: "Bengaluru", state: "Karnataka", pin: "560034", country: "India" },
  { label: "HSR Layout, Bengaluru", locality: "HSR Layout", city: "Bengaluru", state: "Karnataka", pin: "560102", country: "India" },
  { label: "Whitefield, Bengaluru", locality: "Whitefield", city: "Bengaluru", state: "Karnataka", pin: "560066", country: "India" },
  { label: "JP Nagar, Bengaluru", locality: "JP Nagar", city: "Bengaluru", state: "Karnataka", pin: "560078", country: "India" },
  { label: "Connaught Place, New Delhi", locality: "Connaught Place", city: "New Delhi", state: "Delhi", pin: "110001", country: "India" },
];

// ── Purchase Preferences Modal ──
function PurchasePreferenceModal({ open, onClose, outletName }: { open: boolean; onClose: () => void; outletName: string }) {
  const [approvalEnabled, setApprovalEnabled] = useState(true);
  const [approvalEmail, setApprovalEmail] = useState("admin@centofoods.com");
  const [prefTab, setPrefTab] = useState<"import" | "manual">("manual");
  const [prefMaterials, setPrefMaterials] = useState<PurchasePrefMaterial[]>(
    MOCK_MATERIALS_DB.map((m) => ({
      code: m.code,
      name: m.name,
      category: m.category,
      preferredSupplier: MOCK_VENDORS[0],
      parStock: 50,
      unit: m.primaryUnit,
      buyingPrice: m.buyingPrice,
    }))
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return prefMaterials;
    const q = search.toLowerCase();
    return prefMaterials.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }, [prefMaterials, search]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Purchase Preferences — {outletName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Section 1: Order Approval */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Order Approval Settings</h4>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border max-w-md">
              <Label className="text-xs">Enable Order Approval</Label>
              <Switch checked={approvalEnabled} onCheckedChange={setApprovalEnabled} />
            </div>
            {approvalEnabled && (
              <div className="max-w-md">
                <Label className="text-xs">Approval Email ID</Label>
                <Input value={approvalEmail} onChange={(e) => setApprovalEmail(e.target.value)} className="mt-1 h-9 text-sm" placeholder="approval@company.com" />
              </div>
            )}
          </div>

          {/* Section 2: Add Preferences */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Add Preferences</h4>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setPrefTab("import")} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", prefTab === "import" ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>Import</button>
              <button onClick={() => setPrefTab("manual")} className={cn("px-4 py-2 text-xs font-medium rounded-lg border transition-all", prefTab === "manual" ? "border-primary bg-cento-yellow-tint text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>Edit Manually</button>
            </div>

            {prefTab === "import" && (
              <div className="rounded-lg border border-border p-5 bg-muted/20">
                <p className="text-sm font-medium text-foreground mb-2">Instructions to Upload</p>
                <p className="text-xs text-muted-foreground mb-3">Follow the instructions and import data.</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Help & Instructions</p>
                  <p>• Download the sample sheet.</p>
                  <p>• Follow the instructions in the sample sheet for validations.</p>
                  <p>• Paste purchase preference data in specified format.</p>
                  <p>• Upload the edited sheet to update preferences.</p>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">Sample Sheet</Button>
                  <Button variant="cento" size="sm" className="gap-1.5 text-xs">Upload Sheet</Button>
                </div>
              </div>
            )}

            {prefTab === "manual" && (
              <div className="space-y-3">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
                </div>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-xs">Code</TableHead>
                        <TableHead className="text-xs">Name</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Preferred Supplier</TableHead>
                        <TableHead className="text-xs text-right">PAR Stock</TableHead>
                        <TableHead className="text-xs">Units</TableHead>
                        <TableHead className="text-xs text-right">Buying Price/Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((m) => (
                        <TableRow key={m.code}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{m.code}</TableCell>
                          <TableCell className="text-sm">{m.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{m.category}</TableCell>
                          <TableCell>
                            <Select value={m.preferredSupplier} onValueChange={(v) => setPrefMaterials((prev) => prev.map((pm) => pm.code === m.code ? { ...pm, preferredSupplier: v } : pm))}>
                              <SelectTrigger className="h-8 text-xs w-40"><SelectValue /></SelectTrigger>
                              <SelectContent>{MOCK_VENDORS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} value={m.parStock || ""} onChange={(e) => setPrefMaterials((prev) => prev.map((pm) => pm.code === m.code ? { ...pm, parStock: parseFloat(e.target.value) || 0 } : pm))} className="w-20 h-8 text-sm text-right" />
                          </TableCell>
                          <TableCell>
                            <Select value={m.unit} onValueChange={(v) => setPrefMaterials((prev) => prev.map((pm) => pm.code === m.code ? { ...pm, unit: v } : pm))}>
                              <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                              <SelectContent>{MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-sm text-right tabular-nums text-muted-foreground">₹{m.buyingPrice.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="cento" size="sm" onClick={() => { toast({ title: "Preferences Saved", description: `Purchase preferences for ${outletName} updated.` }); onClose(); }}>Save Preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Stock Settings Modal ──
function StockSettingsModal({ open, onClose, outletName }: { open: boolean; onClose: () => void; outletName: string }) {
  const [negativeStock, setNegativeStock] = useState(false);
  const [autoReorder, setAutoReorder] = useState(true);
  const [reorderThreshold, setReorderThreshold] = useState("20");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Stock Settings — {outletName}</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <Label className="text-xs font-medium">Allow Negative Stock</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Allow stock to go below zero</p>
            </div>
            <Switch checked={negativeStock} onCheckedChange={setNegativeStock} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <Label className="text-xs font-medium">Auto Reorder Alerts</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Notify when stock falls below threshold</p>
            </div>
            <Switch checked={autoReorder} onCheckedChange={setAutoReorder} />
          </div>
          {autoReorder && (
            <div>
              <Label className="text-xs">Reorder Threshold (%)</Label>
              <Input type="number" value={reorderThreshold} onChange={(e) => setReorderThreshold(e.target.value)} className="mt-1 h-9 text-sm w-32" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="cento" size="sm" onClick={() => { toast({ title: "Stock Settings Saved", description: `Stock settings for ${outletName} updated.` }); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Site Settings Modal ──
function SiteSettingsModal({ open, onClose, outletName }: { open: boolean; onClose: () => void; outletName: string }) {
  const [operatingHours, setOperatingHours] = useState("09:00 - 22:00");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [weekOff, setWeekOff] = useState("None");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Site Settings — {outletName}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Operating Hours</Label>
            <Input value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} className="mt-1 h-9 text-sm" placeholder="09:00 - 22:00" />
          </div>
          <div>
            <Label className="text-xs">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Weekly Off</Label>
            <Select value={weekOff} onValueChange={setWeekOff}>
              <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="cento" size="sm" onClick={() => { toast({ title: "Site Settings Saved", description: `Site settings for ${outletName} updated.` }); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════
export default function OutletManagement() {
  const [outlets, setOutlets] = useState<OutletRow[]>(INITIAL_OUTLETS);
  const [modalType, setModalType] = useState<"purchase" | "stock" | "site" | null>(null);
  const [modalOutlet, setModalOutlet] = useState<OutletRow | null>(null);

  // Add Outlet form
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<typeof MOCK_LOCATIONS[0] | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [building, setBuilding] = useState("");
  const [locality, setLocality] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pin, setPin] = useState("");
  const [country, setCountry] = useState("");
  const [notifEmail, setNotifEmail] = useState("");
  const [gstin, setGstin] = useState("");
  const [reviewLink, setReviewLink] = useState("");

  const locResults = useMemo(() => {
    if (!locationSearch) return [];
    const q = locationSearch.toLowerCase();
    return MOCK_LOCATIONS.filter((l) => l.label.toLowerCase().includes(q));
  }, [locationSearch]);

  const selectLocation = (loc: typeof MOCK_LOCATIONS[0]) => {
    setSelectedLocation(loc);
    setLocationSearch(loc.label);
    setShowLocDropdown(false);
    setLocality(loc.locality);
    setCity(loc.city);
    setState(loc.state);
    setPin(loc.pin);
    setCountry(loc.country);
  };

  const resetAddForm = () => {
    setLocationSearch(""); setSelectedLocation(null); setDisplayName(""); setBuilding("");
    setLocality(""); setCity(""); setState(""); setPin(""); setCountry("");
    setNotifEmail(""); setGstin(""); setReviewLink("");
  };

  const addOutlet = () => {
    const newOutlet: OutletRow = {
      id: `OTL-${String(outlets.length + 1).padStart(3, "0")}`,
      name: displayName || locationSearch,
      active: true,
      notificationEmail: notifEmail,
      lastUpdated: "13 Mar 2026",
    };
    setOutlets([...outlets, newOutlet]);
    toast({ title: "Outlet Added", description: `${newOutlet.name} has been added.` });
    resetAddForm();
  };

  const canAdd = displayName.trim().length > 0 && (selectedLocation || locality.trim().length > 0);

  return (
    <div className="space-y-8">
      <h2 className="cento-page-title">Outlet Management</h2>

      {/* Section 1: Active Outlet Configs */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Active Outlet Configs</h3>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs">Outlet ID</TableHead>
                <TableHead className="text-xs">Outlet Name</TableHead>
                <TableHead className="text-xs">Activate Outlet</TableHead>
                <TableHead className="text-xs">Notification Email</TableHead>
                <TableHead className="text-xs">Last Updated</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outlets.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{o.id}</TableCell>
                  <TableCell className="text-sm font-medium">{o.name}</TableCell>
                  <TableCell>
                    <Switch checked={o.active} onCheckedChange={(v) => setOutlets(outlets.map((x) => x.id === o.id ? { ...x, active: v, lastUpdated: "13 Mar 2026" } : x))} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{o.notificationEmail}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{o.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setModalOutlet(o); setModalType("purchase"); }}>Purchase Preferences</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setModalOutlet(o); setModalType("stock"); }}>Stock Settings</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setModalOutlet(o); setModalType("site"); }}>Site Settings</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Section 2: Add Outlet */}
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Add Outlet</h3>
        <div className="space-y-4">
          {/* Location Search */}
          <div className="relative max-w-md">
            <Label className="text-xs">Location Search</Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search location..."
                value={locationSearch}
                onChange={(e) => { setLocationSearch(e.target.value); setShowLocDropdown(true); }}
                onFocus={() => setShowLocDropdown(true)}
                className="pl-8 h-9 text-sm"
              />
              {showLocDropdown && locResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[160px] overflow-auto">
                  {locResults.map((l) => (
                    <button key={l.label} onMouseDown={() => selectLocation(l)} className="w-full px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors">
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="max-w-md">
            <Label className="text-xs">Outlet Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-9 text-sm" placeholder="e.g. Branch - Whitefield" />
          </div>

          {/* Building Address */}
          <div className="max-w-md">
            <Label className="text-xs">Building Address</Label>
            <Input value={building} onChange={(e) => setBuilding(e.target.value)} className="mt-1 h-9 text-sm" placeholder="Building / Floor / Unit" />
          </div>

          {/* Locality + City */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Label className="text-xs">Locality</Label>
              <Input value={locality} onChange={(e) => setLocality(e.target.value)} className="mt-1 h-9 text-sm" placeholder="Locality" />
            </div>
            <div>
              <Label className="text-xs">City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 h-9 text-sm" placeholder="City" />
            </div>
          </div>

          {/* State */}
          <div className="max-w-md">
            <Label className="text-xs">State</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} className="mt-1 h-9 text-sm" placeholder="State" />
          </div>

          {/* PIN + Country */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Label className="text-xs">PIN Code</Label>
              <Input value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1 h-9 text-sm" placeholder="PIN Code" />
            </div>
            <div>
              <Label className="text-xs">Country</Label>
              <Input value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 h-9 text-sm" placeholder="Country" />
            </div>
          </div>

          {/* Notification Email + GSTIN */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <Label className="text-xs">Notification Email</Label>
              <Input type="email" value={notifEmail} onChange={(e) => setNotifEmail(e.target.value)} className="mt-1 h-9 text-sm" placeholder="email@company.com" />
            </div>
            <div>
              <Label className="text-xs">GSTIN</Label>
              <Input value={gstin} onChange={(e) => setGstin(e.target.value)} className="mt-1 h-9 text-sm" placeholder="e.g. 29ABCDE1234F1Z5" />
            </div>
          </div>

          {/* Google Business Link */}
          <div className="max-w-md">
            <Label className="text-xs">Google Business Page Review Link</Label>
            <Input value={reviewLink} onChange={(e) => setReviewLink(e.target.value)} className="mt-1 h-9 text-sm" placeholder="https://g.page/..." />
          </div>

          {/* CTA */}
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={resetAddForm}>Cancel</Button>
            <Button variant="cento" size="sm" disabled={!canAdd} onClick={addOutlet}>Add Outlet</Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOutlet && modalType === "purchase" && (
        <PurchasePreferenceModal open onClose={() => { setModalType(null); setModalOutlet(null); }} outletName={modalOutlet.name} />
      )}
      {modalOutlet && modalType === "stock" && (
        <StockSettingsModal open onClose={() => { setModalType(null); setModalOutlet(null); }} outletName={modalOutlet.name} />
      )}
      {modalOutlet && modalType === "site" && (
        <SiteSettingsModal open onClose={() => { setModalType(null); setModalOutlet(null); }} outletName={modalOutlet.name} />
      )}
    </div>
  );
}
