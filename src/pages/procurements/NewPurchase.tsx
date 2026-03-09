import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  FilePlus,
  Search,
  Trash2,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Plus,
  Tag,
  X,
  Lock,
  Pencil,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePOStore, type SupplierType } from "@/context/POStoreContext";

// --- Mock Data ---
const MOCK_VENDORS = [
  { id: "v1", name: "Fresh Farms Pvt Ltd", gst: "29AABCU9603R1ZX", location: "Bangalore" },
  { id: "v2", name: "Spice World Traders", gst: "27AABCS1429B1ZV", location: "Mumbai" },
  { id: "v3", name: "Daily Dairy Supplies", gst: "07AABCD2345F1ZP", location: "Delhi" },
  { id: "v4", name: "Ocean Catch Seafoods", gst: "33AABCO4567G1ZQ", location: "Chennai" },
  { id: "v5", name: "Green Valley Produce", gst: "29AABCG7891H1ZR", location: "Mysore" },
  { id: "v6", name: "Metro Packaging Co.", gst: "27AABCM3456I1ZS", location: "Pune" },
  { id: "v7", name: "Baker's Delight Ingredients", gst: "29AABCB6789J1ZT", location: "Bangalore" },
];

const MOCK_MATERIALS: { id: string; code: string; name: string; category: string; primaryUnit: string; currentStock: number; buyingPrice: number }[] = [
  { id: "m1", code: "RM-001", name: "Basmati Rice", category: "Grains", primaryUnit: "KG", currentStock: 120, buyingPrice: 85 },
  { id: "m2", code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", primaryUnit: "LTR", currentStock: 45, buyingPrice: 620 },
  { id: "m3", code: "RM-003", name: "Chicken Breast", category: "Meat", primaryUnit: "KG", currentStock: 30, buyingPrice: 280 },
  { id: "m4", code: "RM-004", name: "Onion (Red)", category: "Vegetables", primaryUnit: "KG", currentStock: 200, buyingPrice: 35 },
  { id: "m5", code: "RM-005", name: "Tomato Paste", category: "Sauces", primaryUnit: "KG", currentStock: 60, buyingPrice: 150 },
  { id: "m6", code: "RM-006", name: "Cumin Powder", category: "Spices", primaryUnit: "KG", currentStock: 15, buyingPrice: 450 },
  { id: "m7", code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", primaryUnit: "KG", currentStock: 25, buyingPrice: 520 },
  { id: "m8", code: "RM-008", name: "All-Purpose Flour", category: "Grains", primaryUnit: "KG", currentStock: 300, buyingPrice: 42 },
  { id: "m9", code: "RM-009", name: "Garlic", category: "Vegetables", primaryUnit: "KG", currentStock: 40, buyingPrice: 120 },
  { id: "m10", code: "RM-010", name: "Ginger", category: "Vegetables", primaryUnit: "KG", currentStock: 35, buyingPrice: 100 },
  { id: "m11", code: "RM-011", name: "Salmon Fillet", category: "Seafood", primaryUnit: "KG", currentStock: 10, buyingPrice: 1200 },
  { id: "m12", code: "RM-012", name: "Cinnamon Sticks", category: "Spices", primaryUnit: "KG", currentStock: 5, buyingPrice: 800 },
];

const MOCK_TAX_TYPES = [
  { id: "t1", name: "GST", rate: 18 },
  { id: "t2", name: "IGST", rate: 18 },
  { id: "t3", name: "SGST", rate: 9 },
  { id: "t4", name: "CGST", rate: 9 },
];

const MOCK_CATEGORIES = [
  "Grains", "Oils", "Meat", "Vegetables", "Sauces", "Spices", "Dairy", "Seafood", "Packaging", "Beverages",
];

const MOCK_UNITS = [
  "KG", "LTR", "PCS", "GM", "ML", "DOZ", "PKT", "BOX",
];

const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

// --- Types ---
interface TaxEntry {
  id: string;
  taxTypeId: string;
  taxName: string;
  taxRate: number;
  taxAmount: number;
}

interface POLineItem {
  id: string;
  materialId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  buyingPrice: number;
  purchaseStock: number;
  purchaseAmount: number;
  taxes: TaxEntry[];
  totalTaxAmount: number;
  totalAmount: number;
}

interface OtherCharge {
  id: string;
  description: string;
  amount: number;
}

function recalcItemTaxes(item: POLineItem): POLineItem {
  const purchaseAmount = item.buyingPrice * item.purchaseStock;
  const taxes = item.taxes.map((t) => ({
    ...t,
    taxAmount: (purchaseAmount * t.taxRate) / 100,
  }));
  const totalTaxAmount = taxes.reduce((s, t) => s + t.taxAmount, 0);
  return { ...item, purchaseAmount, taxes, totalTaxAmount, totalAmount: purchaseAmount + totalTaxAmount };
}

// --- Searchable Dropdown Component ---
interface SearchableDropdownProps {
  items: { id: string; name: string; detail?: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  locked: boolean;
  placeholder: string;
}

function SearchableDropdown({ items, selectedId, onSelect, locked, placeholder }: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = items.find((v) => v.id === selectedId);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((v) => v.name.toLowerCase().includes(q));
  }, [query, items]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (locked && selected) {
    return (
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm cursor-not-allowed">
        <span className="text-foreground font-medium truncate">{selected.name}</span>
        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          value={selected && !open ? selected.name : query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[220px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">No results found</div>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                onMouseDown={() => { onSelect(v.id); setOpen(false); setQuery(""); }}
                className={cn(
                  "w-full flex flex-col items-start px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0",
                  selectedId === v.id && "bg-muted/40"
                )}
              >
                <span className="text-sm font-medium text-foreground">{v.name}</span>
                {v.detail && <span className="text-xs text-muted-foreground mt-0.5">{v.detail}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- Material Selection Modal ---
interface MaterialModalProps {
  open: boolean;
  onClose: () => void;
  existingMaterialIds: string[];
  onAddMaterials: (materialIds: string[]) => void;
}

function MaterialSelectionModal({ open, onClose, existingMaterialIds, onAddMaterials }: MaterialModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(existingMaterialIds));
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "selected">("all");

  // Reset when opening
  useEffect(() => {
    if (open) {
      setSelectedIds(new Set(existingMaterialIds));
      setSearchQuery("");
      setViewMode("all");
    }
  }, [open, existingMaterialIds]);

  const categories = useMemo(() => {
    const cats: Record<string, typeof MOCK_MATERIALS> = {};
    MOCK_MATERIALS.forEach((m) => {
      if (!cats[m.category]) cats[m.category] = [];
      cats[m.category].push(m);
    });
    return cats;
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const result: Record<string, typeof MOCK_MATERIALS> = {};
    Object.entries(categories).forEach(([cat, mats]) => {
      const catMatch = cat.toLowerCase().includes(q);
      const filteredMats = mats.filter((m) => {
        if (viewMode === "selected" && !selectedIds.has(m.id)) return false;
        if (!q) return true;
        return catMatch || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q);
      });
      if (filteredMats.length > 0) result[cat] = filteredMats;
    });
    return result;
  }, [categories, searchQuery, viewMode, selectedIds]);

  const toggleMaterial = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    const mats = categories[cat] || [];
    const allSelected = mats.every((m) => selectedIds.has(m.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      mats.forEach((m) => {
        if (allSelected) next.delete(m.id);
        else next.add(m.id);
      });
      return next;
    });
  };

  const toggleAll = () => {
    const allSelected = MOCK_MATERIALS.every((m) => selectedIds.has(m.id));
    if (allSelected) setSelectedIds(new Set(existingMaterialIds));
    else setSelectedIds(new Set(MOCK_MATERIALS.map((m) => m.id)));
  };

  const handleConfirm = () => {
    onAddMaterials(Array.from(selectedIds));
    onClose();
  };

  const allSelected = MOCK_MATERIALS.every((m) => selectedIds.has(m.id));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Materials</DialogTitle>
        </DialogHeader>

        {/* Global search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories or materials..."
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Toggle: All / Selected */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
            <button
              onClick={() => setViewMode("all")}
              className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >All</button>
            <button
              onClick={() => setViewMode("selected")}
              className={cn("px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "selected" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >Selected ({selectedIds.size})</button>
          </div>
          <div className="ml-auto">
            <button onClick={toggleAll} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>

        {/* Two-panel: Categories (left) + Materials (right) */}
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden border border-border rounded-lg">
          {/* Left: Categories */}
          <div className="w-[200px] border-r border-border overflow-y-auto py-2 shrink-0">
            {Object.entries(filteredCategories).map(([cat, mats]) => {
              const allCatSelected = (categories[cat] || []).every((m) => selectedIds.has(m.id));
              const someCatSelected = (categories[cat] || []).some((m) => selectedIds.has(m.id));
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/60 transition-colors text-left"
                >
                  <Checkbox
                    checked={allCatSelected ? true : someCatSelected ? "indeterminate" : false}
                    onCheckedChange={() => toggleCategory(cat)}
                    className="h-3.5 w-3.5"
                  />
                  <span className={cn("font-medium text-xs", allCatSelected && "text-primary")}>{cat}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">({mats.length})</span>
                </button>
              );
            })}
          </div>

          {/* Right: Materials */}
          <div className="flex-1 overflow-y-auto py-2">
            {Object.entries(filteredCategories).map(([cat, mats]) => (
              <div key={cat} className="mb-3">
                <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
                {mats.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleMaterial(m.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted/40 transition-colors text-left",
                      selectedIds.has(m.id) && "bg-cento-yellow-tint"
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.has(m.id)}
                      onCheckedChange={() => toggleMaterial(m.id)}
                      className="h-3.5 w-3.5"
                    />
                    <span className="font-mono text-xs text-muted-foreground w-14 shrink-0">{m.code}</span>
                    <span className="font-medium text-sm flex-1 truncate">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.primaryUnit}</span>
                  </button>
                ))}
              </div>
            ))}
            {Object.keys(filteredCategories).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No materials found</div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="cento" onClick={handleConfirm}>
            Add {selectedIds.size} Material{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN COMPONENT =====================

export default function NewPurchase() {
  const navigate = useNavigate();
  const { addOrder } = usePOStore();

  // Core state
  const [buyerOutlet, setBuyerOutlet] = useState("o1");
  const [outletEditOpen, setOutletEditOpen] = useState(false);
  const [outletSearchQuery, setOutletSearchQuery] = useState("");
  const outletEditRef = useRef<HTMLDivElement>(null);

  const [supplierType, setSupplierType] = useState<SupplierType>("Vendor");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedSupplyingOutlet, setSelectedSupplyingOutlet] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [eddError, setEddError] = useState(false);
  const [remarks, setRemarks] = useState("");

  // Other charges
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([]);

  // Search for table filter
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  // Material modal
  const [materialModalOpen, setMaterialModalOpen] = useState(false);

  // Dialog states
  const [taxModalItemId, setTaxModalItemId] = useState<string | null>(null);
  const [taxModalTaxTypeId, setTaxModalTaxTypeId] = useState("");
  const [bulkTaxModalOpen, setBulkTaxModalOpen] = useState(false);
  const [bulkTaxTypeId, setBulkTaxTypeId] = useState("");
  const [activeBulkTax, setActiveBulkTax] = useState<{ taxTypeId: string; taxName: string; taxRate: number } | null>(null);
  const [taxBreakdownOpen, setTaxBreakdownOpen] = useState(true);

  // Supplier/toggle is locked once materials are added
  const supplierLocked = lineItems.length > 0;
  const supplierSelected = supplierType === "Vendor" ? !!selectedVendor : !!selectedSupplyingOutlet;
  const supplierName = supplierType === "Vendor"
    ? MOCK_VENDORS.find((v) => v.id === selectedVendor)?.name
    : MOCK_OUTLETS.find((o) => o.id === selectedSupplyingOutlet)?.name;

  const buyerOutletName = MOCK_OUTLETS.find((o) => o.id === buyerOutlet)?.name ?? "Unknown";

  // Outlets for supplying (exclude buyer)
  const supplyingOutlets = useMemo(() =>
    MOCK_OUTLETS.filter((o) => o.id !== buyerOutlet).map((o) => ({ id: o.id, name: o.name })),
    [buyerOutlet]
  );

  // Vendor items for dropdown
  const vendorItems = useMemo(() =>
    MOCK_VENDORS.map((v) => ({ id: v.id, name: v.name, detail: `${v.gst} · ${v.location}` })),
    []
  );

  // Outlet edit dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (outletEditRef.current && !outletEditRef.current.contains(e.target as Node)) {
        setOutletEditOpen(false);
        setOutletSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredOutletsForBuyer = useMemo(() => {
    if (!outletSearchQuery.trim()) return MOCK_OUTLETS;
    const q = outletSearchQuery.toLowerCase();
    return MOCK_OUTLETS.filter((o) => o.name.toLowerCase().includes(q));
  }, [outletSearchQuery]);

  // Filtered table items
  const displayItems = useMemo(() => {
    if (!tableSearchQuery.trim()) return lineItems;
    const q = tableSearchQuery.toLowerCase();
    return lineItems.filter((li) => li.name.toLowerCase().includes(q) || li.code.toLowerCase().includes(q));
  }, [lineItems, tableSearchQuery]);

  // Tax modal derived
  const taxModalItem = lineItems.find((li) => li.id === taxModalItemId);
  const taxModalSelectedTax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTaxTypeId);
  const bulkSelectedTax = MOCK_TAX_TYPES.find((t) => t.id === bulkTaxTypeId);

  // Totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, li) => s + li.purchaseAmount, 0);
    const totalTax = lineItems.reduce((s, li) => s + li.totalTaxAmount, 0);
    const totalOtherCharges = otherCharges.reduce((s, c) => s + c.amount, 0);
    const taxBreakdown: Record<string, number> = {};
    lineItems.forEach((li) => {
      li.taxes.forEach((t) => {
        taxBreakdown[t.taxName] = (taxBreakdown[t.taxName] ?? 0) + t.taxAmount;
      });
    });
    return { subtotal, totalTax, totalOtherCharges, grandTotal: subtotal + totalTax + totalOtherCharges, taxBreakdown };
  }, [lineItems, otherCharges]);

  const hasItems = lineItems.length > 0;
  const canGenerate = hasItems && supplierSelected && !!deliveryDate;

  // --- Handlers ---
  const handleSupplierTypeChange = (type: SupplierType) => {
    if (supplierLocked) return;
    setSupplierType(type);
    setSelectedVendor(null);
    setSelectedSupplyingOutlet(null);
  };

  const addMaterialsFromModal = useCallback((materialIds: string[]) => {
    setLineItems((prev) => {
      const existingIds = new Set(prev.map((li) => li.materialId));
      const newItems = [...prev];

      // Add-only: only append new materials, never remove existing rows
      materialIds.forEach((id) => {
        if (existingIds.has(id)) return;
        const mat = MOCK_MATERIALS.find((m) => m.id === id);
        if (!mat) return;
        newItems.push({
          id: crypto.randomUUID(),
          materialId: mat.id,
          code: mat.code,
          name: mat.name,
          category: mat.category,
          unit: mat.primaryUnit,
          currentStock: mat.currentStock,
          buyingPrice: mat.buyingPrice,
          purchaseStock: 0,
          purchaseAmount: 0,
          taxes: activeBulkTax
            ? [{ id: crypto.randomUUID(), taxTypeId: activeBulkTax.taxTypeId, taxName: activeBulkTax.taxName, taxRate: activeBulkTax.taxRate, taxAmount: 0 }]
            : [],
          totalTaxAmount: 0,
          totalAmount: 0,
        });
      });

      return newItems;
    });
  }, [activeBulkTax]);

  const removeItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<POLineItem>) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== id) return li;
        return recalcItemTaxes({ ...li, ...updates });
      })
    );
  }, []);

  // Tax modal handlers
  const openTaxModal = (itemId: string) => {
    setTaxModalItemId(itemId);
    setTaxModalTaxTypeId("");
  };

  const addTaxToItem = () => {
    if (!taxModalItemId || !taxModalTaxTypeId) return;
    const tax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTaxTypeId);
    if (!tax) return;
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== taxModalItemId) return li;
        if (li.taxes.some((t) => t.taxTypeId === taxModalTaxTypeId)) {
          toast({ title: "Tax already applied", description: `${tax.name} is already applied.` });
          return li;
        }
        const newTax: TaxEntry = {
          id: crypto.randomUUID(),
          taxTypeId: tax.id,
          taxName: tax.name,
          taxRate: tax.rate,
          taxAmount: (li.purchaseAmount * tax.rate) / 100,
        };
        return recalcItemTaxes({ ...li, taxes: [...li.taxes, newTax] });
      })
    );
    setTaxModalItemId(null);
    setTaxModalTaxTypeId("");
  };

  const removeTaxFromItem = (itemId: string, taxId: string) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id !== itemId) return li;
        return recalcItemTaxes({ ...li, taxes: li.taxes.filter((t) => t.id !== taxId) });
      })
    );
  };

  // Bulk tax handler
  const applyBulkTax = () => {
    if (!bulkTaxTypeId) return;
    const tax = MOCK_TAX_TYPES.find((t) => t.id === bulkTaxTypeId);
    if (!tax) return;
    setActiveBulkTax({ taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate });
    setLineItems((prev) =>
      prev.map((li) => {
        let taxes = [...li.taxes];
        if (!taxes.some((t) => t.taxTypeId === tax.id)) {
          taxes = [...taxes, { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate, taxAmount: 0 }];
        }
        return recalcItemTaxes({ ...li, taxes });
      })
    );
    setBulkTaxModalOpen(false);
    setBulkTaxTypeId("");
    toast({ title: "Tax applied", description: `${tax.name} ${tax.rate}% applied to all materials.` });
  };

  // Other charges handlers
  const addOtherCharge = () => {
    setOtherCharges((prev) => [...prev, { id: crypto.randomUUID(), description: "", amount: 0 }]);
  };
  const updateOtherCharge = (id: string, updates: Partial<OtherCharge>) => {
    setOtherCharges((prev) => prev.map((c) => c.id === id ? { ...c, ...updates } : c));
  };
  const removeOtherCharge = (id: string) => {
    setOtherCharges((prev) => prev.filter((c) => c.id !== id));
  };

  const buildOrderPayload = (status: "Drafted" | "Raised") => {
    const now = format(new Date(), "yyyy-MM-dd");
    const materials = lineItems.map((li) => ({
      name: li.name,
      orderedQty: li.purchaseStock,
      unitPrice: li.buyingPrice,
      taxPct: li.taxes.reduce((s, t) => s + t.taxRate, 0),
      lineTotal: li.purchaseAmount,
      receivedQty: 0,
      pendingQty: li.purchaseStock,
    }));
    return {
      vendor: supplierName ?? "",
      outlet: buyerOutletName,
      supplierType,
      totalValue: totals.grandTotal,
      totalQty: lineItems.reduce((s, li) => s + li.purchaseStock, 0),
      createdBy: "Admin",
      createdOn: now,
      lastUpdated: now,
      status,
      expectedDelivery: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : undefined,
      remarks,
      materials,
      poSubtotal: totals.subtotal,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
      otherCharges: totals.totalOtherCharges,
      taxBreakdown: totals.taxBreakdown,
    } as const;
  };

  const handleSubmitForApproval = () => {
    if (!deliveryDate) { setEddError(true); return; }
    setEddError(false);
    if (!hasItems || !supplierSelected) return;
    addOrder(buildOrderPayload("Raised"));
    toast({ title: "PO Submitted", description: "Purchase order has been submitted for approval." });
    navigate("/procurements/purchases", { state: { tab: "raised" } });
  };

  const handleDraft = () => {
    if (!hasItems || !supplierSelected) return;
    addOrder(buildOrderPayload("Drafted"));
    toast({ title: "Draft saved", description: "Purchase order saved as draft." });
    navigate("/procurements/purchases", { state: { tab: "drafted" } });
  };

  const handleSaveAsTemplate = () => {
    toast({ title: "Redirecting to Purchase Management", description: "Configure your template settings." });
    navigate("/settings", { state: { section: "/settings/purchase-management" } });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Page Header with Buyer's Outlet ── */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
            <FilePlus className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="cento-page-title">New Purchase Order</h2>
            <p className="cento-helper mt-0.5">Create a new purchase order</p>
          </div>
        </div>

        {/* Buyer's Outlet */}
        <div className="text-right relative" ref={outletEditRef}>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Buyer's Outlet</p>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-sm font-semibold text-foreground">{buyerOutletName}</span>
            <button
              onClick={() => setOutletEditOpen((v) => !v)}
              className="p-1 rounded hover:bg-muted/60 transition-colors"
            >
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
          {outletEditOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <input
                    value={outletSearchQuery}
                    onChange={(e) => setOutletSearchQuery(e.target.value)}
                    placeholder="Search outlets..."
                    className="w-full h-7 pl-7 pr-2 text-xs rounded border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                {filteredOutletsForBuyer.map((o) => (
                  <button
                    key={o.id}
                    onMouseDown={() => {
                      setBuyerOutlet(o.id);
                      setOutletEditOpen(false);
                      setOutletSearchQuery("");
                      // If supplying outlet was the same, clear it
                      if (selectedSupplyingOutlet === o.id) setSelectedSupplyingOutlet(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors",
                      buyerOutlet === o.id && "bg-cento-yellow-tint font-medium"
                    )}
                  >
                    {buyerOutlet === o.id && <Check className="h-3 w-3 text-primary flex-shrink-0" />}
                    <span className={buyerOutlet !== o.id ? "ml-5" : ""}>{o.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Supplier Section ── */}
      <div className="bg-card border border-border rounded-xl px-6 py-5 mb-6 flex-shrink-0 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Supplier Type Toggle + Dropdown */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Supplier Type
              {supplierLocked && <span className="ml-1.5 text-xs font-normal normal-case tracking-normal">(locked)</span>}
            </Label>
            <div className={cn("inline-flex rounded-lg border border-border p-0.5 bg-muted/40 w-fit", supplierLocked && "opacity-60 pointer-events-none")}>
              <button
                onClick={() => handleSupplierTypeChange("Vendor")}
                className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                  supplierType === "Vendor" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >Vendor</button>
              <button
                onClick={() => handleSupplierTypeChange("Outlet")}
                className={cn("px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
                  supplierType === "Outlet" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >Outlet</button>
            </div>
          </div>

          {/* Vendor / Supplying Outlet dropdown */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {supplierType === "Vendor" ? "Vendor" : "Supplying Outlet"}
            </Label>
            {supplierType === "Vendor" ? (
              <SearchableDropdown
                items={vendorItems}
                selectedId={selectedVendor}
                onSelect={(id) => !supplierLocked && setSelectedVendor(id)}
                locked={supplierLocked}
                placeholder="Search and select vendor"
              />
            ) : (
              <SearchableDropdown
                items={supplyingOutlets}
                selectedId={selectedSupplyingOutlet}
                onSelect={(id) => !supplierLocked && setSelectedSupplyingOutlet(id)}
                locked={supplierLocked}
                placeholder="Search and select outlet"
              />
            )}
          </div>

          {/* Expected Delivery Date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Expected Delivery Date <span className="text-destructive">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 w-full justify-start text-left font-normal bg-background",
                    !deliveryDate && "text-muted-foreground",
                    eddError && "border-destructive ring-1 ring-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                  {deliveryDate ? format(deliveryDate, "dd MMM yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={(d) => { setDeliveryDate(d); if (d) setEddError(false); }}
                  initialFocus
                  className="p-3 pointer-events-auto"
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
            {eddError && <p className="text-xs text-destructive">Expected Delivery Date is required.</p>}
          </div>
        </div>
      </div>

      {/* ── Search bar + Add Material CTA ── */}
      {supplierSelected && (
        <div className="mb-4 flex-shrink-0 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={tableSearchQuery}
              onChange={(e) => setTableSearchQuery(e.target.value)}
              placeholder="Search materials in the PO..."
              className="pl-9 h-9 text-sm bg-card"
            />
          </div>
          <Button
            variant="cento"
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setMaterialModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Material
          </Button>
        </div>
      )}

      {/* ── Materials Table ── */}
      {supplierSelected ? (
        <div className="bg-card border border-border rounded-xl shadow-sm mb-6 flex-shrink-0 overflow-hidden">
          {/* Table header bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Materials
              {hasItems && <span className="ml-2 text-foreground">({lineItems.length})</span>}
            </span>
            {hasItems && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 bg-background"
                onClick={() => { setBulkTaxTypeId(""); setBulkTaxModalOpen(true); }}
              >
                <Tag className="h-3 w-3" />
                Apply Tax to All
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Material</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buying Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purchase Amt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[180px]">Taxes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Tax</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Amt</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {displayItems.length === 0 && lineItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-muted-foreground text-sm py-14">
                      Click "Add Material" to start adding materials
                    </td>
                  </tr>
                )}
                {displayItems.length === 0 && lineItems.length > 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-muted-foreground text-sm py-14">
                      No materials match your search
                    </td>
                  </tr>
                )}
                {displayItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors align-top">
                    <td className="px-4 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{item.code}</td>
                    <td className="px-4 py-4 font-medium whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-4">
                      <Select value={item.category} onValueChange={(val) => updateItem(item.id, { category: val })}>
                        <SelectTrigger className="w-28 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4">
                      <Select value={item.unit} onValueChange={(val) => updateItem(item.id, { unit: val })}>
                        <SelectTrigger className="w-20 h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground text-right tabular-nums">{item.currentStock}</td>
                    <td className="px-4 py-4 text-right tabular-nums">₹{item.buyingPrice.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <Input
                        type="number"
                        min={0}
                        value={item.purchaseStock || ""}
                        onChange={(e) => updateItem(item.id, { purchaseStock: parseFloat(e.target.value) || 0 })}
                        className="w-20 h-8 text-sm text-right bg-background"
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-medium tabular-nums">₹{item.purchaseAmount.toFixed(2)}</td>

                    {/* Taxes column */}
                    <td className="px-4 py-4 min-w-[180px]">
                      <div className="flex flex-col gap-1.5">
                        {item.taxes.map((t) => (
                          <div key={t.id} className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2 py-0.5 text-xs font-medium text-foreground">
                              {t.taxName} {t.taxRate}%
                              <button
                                onClick={() => removeTaxFromItem(item.id, t.id)}
                                className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">₹{t.taxAmount.toFixed(0)}</span>
                          </div>
                        ))}
                        <button
                          className="inline-flex items-center gap-1 text-[11px] text-primary/80 hover:text-primary font-medium transition-colors w-fit rounded border border-dashed border-primary/30 hover:border-primary/50 px-2 py-0.5"
                          onClick={() => openTaxModal(item.id)}
                        >
                          <Plus className="h-2.5 w-2.5" />
                          Add
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">
                      {item.totalTaxAmount > 0 ? `₹${item.totalTaxAmount.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold tabular-nums">₹{item.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm flex items-center justify-center py-20 mb-6">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <FilePlus className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">Select a {supplierType.toLowerCase()} to get started</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a {supplierType.toLowerCase()} above to begin adding materials</p>
          </div>
        </div>
      )}

      {/* ── Other Charges Section ── */}
      {supplierSelected && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Other Charges</p>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addOtherCharge}>
              <Plus className="h-3 w-3" /> Add Charge
            </Button>
          </div>
          {otherCharges.length === 0 ? (
            <p className="text-xs text-muted-foreground">No additional charges added.</p>
          ) : (
            <div className="space-y-2">
              {otherCharges.map((charge) => (
                <div key={charge.id} className="flex items-center gap-3">
                  <Input
                    placeholder="Description (e.g. Freight, Handling)"
                    value={charge.description}
                    onChange={(e) => updateOtherCharge(charge.id, { description: e.target.value })}
                    className="flex-1 h-8 text-sm bg-background"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      value={charge.amount || ""}
                      onChange={(e) => updateOtherCharge(charge.id, { amount: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-sm text-right bg-background pl-6"
                    />
                  </div>
                  <button onClick={() => removeOtherCharge(charge.id)} className="p-1 rounded hover:bg-destructive/10">
                    <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PO Remarks + PO Summary + CTAs ── */}
      {supplierSelected && (
        <div className="flex gap-6 mb-8 flex-shrink-0 items-start">
          {/* PO Remarks */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-[3]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">PO Remarks</p>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes or instructions..."
              className="min-h-[120px] resize-none bg-background text-sm border-border"
            />
          </div>

          {/* PO Summary + CTAs */}
          <div className="flex-[2] flex flex-col gap-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">PO Summary</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Tax breakdown */}
                <div>
                  <div className="flex justify-between items-center text-sm">
                    <button
                      onClick={() => setTaxBreakdownOpen((v) => !v)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Total Tax</span>
                      {Object.keys(totals.taxBreakdown).length > 0 && (
                        taxBreakdownOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <span className="tabular-nums">₹{totals.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {taxBreakdownOpen && Object.keys(totals.taxBreakdown).length > 0 && (
                    <div className="mt-2 ml-3 space-y-1.5 border-l-2 border-border pl-3">
                      {Object.entries(totals.taxBreakdown).map(([name, amt]) => (
                        <div key={name} className="flex justify-between text-xs text-muted-foreground">
                          <span>{name}</span>
                          <span className="tabular-nums">₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Charges */}
                {totals.totalOtherCharges > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Other Charges</span>
                    <span className="tabular-nums">₹{totals.totalOtherCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="border-t border-border" />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">Total PO Amount</span>
                  <span className="text-xl font-bold text-foreground tabular-nums">
                    ₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              {!canGenerate && (
                <p className="text-xs text-muted-foreground text-right">Complete required fields to generate PO.</p>
              )}
              <div className="flex gap-3 justify-between">
                <Button
                  variant="outline"
                  disabled={!hasItems}
                  className={cn("bg-background", !hasItems && "opacity-40 cursor-not-allowed")}
                  onClick={handleSaveAsTemplate}
                >
                  Save as Template
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    disabled={!hasItems}
                    className={cn("bg-background min-w-[100px]", !hasItems && "opacity-40 cursor-not-allowed")}
                    onClick={handleDraft}
                  >
                    Save as Draft
                  </Button>
                  <Button
                    variant="cento"
                    disabled={!canGenerate}
                    className={cn("min-w-[120px]", !canGenerate && "opacity-40 cursor-not-allowed")}
                    onClick={handleGenerate}
                  >
                    Generate PO
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Tax Modal ─── */}
      <Dialog open={!!taxModalItemId} onOpenChange={(open) => { if (!open) { setTaxModalItemId(null); setTaxModalTaxTypeId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Tax — {taxModalItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Name</Label>
              <Select value={taxModalTaxTypeId} onValueChange={setTaxModalTaxTypeId}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select tax type" /></SelectTrigger>
                <SelectContent>
                  {MOCK_TAX_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {taxModalSelectedTax && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Value (%)</Label>
                <Input value={`${taxModalSelectedTax.rate}%`} disabled className="bg-muted" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTaxModalItemId(null); setTaxModalTaxTypeId(""); }}>Cancel</Button>
            <Button variant="cento" disabled={!taxModalTaxTypeId} onClick={addTaxToItem}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Apply Tax Modal ─── */}
      <Dialog open={bulkTaxModalOpen} onOpenChange={setBulkTaxModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Tax to All Materials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Name</Label>
              <Select value={bulkTaxTypeId} onValueChange={setBulkTaxTypeId}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select tax type" /></SelectTrigger>
                <SelectContent>
                  {MOCK_TAX_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {bulkSelectedTax && (
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Tax Value (%)</Label>
                <Input value={`${bulkSelectedTax.rate}%`} disabled className="bg-muted" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTaxModalOpen(false)}>Cancel</Button>
            <Button variant="cento" disabled={!bulkTaxTypeId} onClick={applyBulkTax}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Material Selection Modal ─── */}
      <MaterialSelectionModal
        open={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        existingMaterialIds={lineItems.map((li) => li.materialId)}
        onAddMaterials={addMaterialsFromModal}
      />
    </div>
  );
}
