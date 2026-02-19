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
  MapPin,
  Plus,
  FileText,
  Tag,
  X,
  Lock,
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

import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePOStore } from "@/context/POStoreContext";

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

const MOCK_MATERIALS = [
  { id: "m1", code: "RM-001", name: "Basmati Rice", category: "Grains", primaryUnit: "KG", currentStock: 120, buyingPrice: 85 },
  { id: "m2", code: "RM-002", name: "Olive Oil (Extra Virgin)", category: "Oils", primaryUnit: "LTR", currentStock: 45, buyingPrice: 620 },
  { id: "m3", code: "RM-003", name: "Chicken Breast", category: "Meat", primaryUnit: "KG", currentStock: 30, buyingPrice: 280 },
  { id: "m4", code: "RM-004", name: "Onion (Red)", category: "Vegetables", primaryUnit: "KG", currentStock: 200, buyingPrice: 35 },
  { id: "m5", code: "RM-005", name: "Tomato Paste", category: "Sauces", primaryUnit: "KG", currentStock: 60, buyingPrice: 150 },
  { id: "m6", code: "RM-006", name: "Cumin Powder", category: "Spices", primaryUnit: "KG", currentStock: 15, buyingPrice: 450 },
  { id: "m7", code: "RM-007", name: "Mozzarella Cheese", category: "Dairy", primaryUnit: "KG", currentStock: 25, buyingPrice: 520 },
  { id: "m8", code: "RM-008", name: "All-Purpose Flour", category: "Grains", primaryUnit: "KG", currentStock: 300, buyingPrice: 42 },
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
];

const MOCK_TEMPLATES = [
  { id: "tpl1", vendorId: "v1", name: "Weekly Staples", materialIds: ["m1", "m4"] },
  { id: "tpl2", vendorId: "v1", name: "Grain Restock", materialIds: ["m1", "m8"] },
  { id: "tpl2b", vendorId: "v2", name: "Spice Kit", materialIds: ["m5", "m6"] },
  { id: "tpl3", vendorId: "v3", name: "Dairy Bundle", materialIds: ["m7"] },
  { id: "tpl4", vendorId: "v5", name: "Produce Pack", materialIds: ["m4", "m5"] },
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

function recalcItemTaxes(item: POLineItem): POLineItem {
  const purchaseAmount = item.buyingPrice * item.purchaseStock;
  const taxes = item.taxes.map((t) => ({
    ...t,
    taxAmount: (purchaseAmount * t.taxRate) / 100,
  }));
  const totalTaxAmount = taxes.reduce((s, t) => s + t.taxAmount, 0);
  return { ...item, purchaseAmount, taxes, totalTaxAmount, totalAmount: purchaseAmount + totalTaxAmount };
}

// --- Vendor Search Dropdown Component ---
interface VendorSearchDropdownProps {
  selectedVendor: string | null;
  onSelect: (vendorId: string) => void;
  locked: boolean;
}

function VendorSearchDropdown({ selectedVendor, onSelect, locked }: VendorSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedVendorData = MOCK_VENDORS.find((v) => v.id === selectedVendor);

  const filtered = useMemo(() => {
    if (!query.trim()) return MOCK_VENDORS;
    const q = query.toLowerCase();
    return MOCK_VENDORS.filter((v) => v.name.toLowerCase().includes(q));
  }, [query]);

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

  if (locked && selectedVendorData) {
    return (
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-muted/40 px-3 py-2 text-sm cursor-not-allowed">
        <span className="text-foreground font-medium truncate">{selectedVendorData.name}</span>
        <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-2" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={selectedVendorData && !open ? selectedVendorData.name : query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setOpen(true); setQuery(""); }}
          placeholder="Search and select vendor"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          readOnly={false}
        />
        {selectedVendorData && !open && (
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[220px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-center text-muted-foreground">No vendors found</div>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                onMouseDown={() => { onSelect(v.id); setOpen(false); setQuery(""); }}
                className={cn(
                  "w-full flex flex-col items-start px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0",
                  selectedVendor === v.id && "bg-muted/40"
                )}
              >
                <span className="text-sm font-medium text-foreground">{v.name}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{v.gst} · {v.location}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function NewPurchase() {
  const navigate = useNavigate();
  const { addOrder } = usePOStore();
  const isAdmin = true;

  // Core state
  const [selectedOutlet, setSelectedOutlet] = useState("o1");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [eddError, setEddError] = useState(false);
  const [remarks, setRemarks] = useState("");

  // Dialog states
  const [taxModalItemId, setTaxModalItemId] = useState<string | null>(null);
  const [taxModalTaxTypeId, setTaxModalTaxTypeId] = useState("");
  const [bulkTaxModalOpen, setBulkTaxModalOpen] = useState(false);
  const [bulkTaxTypeId, setBulkTaxTypeId] = useState("");
  const [activeBulkTax, setActiveBulkTax] = useState<{ taxTypeId: string; taxName: string; taxRate: number } | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateVendorId, setTemplateVendorId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [taxBreakdownOpen, setTaxBreakdownOpen] = useState(false);

  // Vendor is locked once materials are added
  const vendorLocked = lineItems.length > 0;

  const selectedVendorData = MOCK_VENDORS.find((v) => v.id === selectedVendor);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MOCK_MATERIALS.filter(
      (m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Tax modal derived
  const taxModalItem = lineItems.find((li) => li.id === taxModalItemId);
  const taxModalSelectedTax = MOCK_TAX_TYPES.find((t) => t.id === taxModalTaxTypeId);
  const bulkSelectedTax = MOCK_TAX_TYPES.find((t) => t.id === bulkTaxTypeId);

  // Template derived
  const effectiveTemplateVendorId = selectedVendor ? selectedVendor : templateVendorId;
  const vendorTemplates = MOCK_TEMPLATES.filter((t) => t.vendorId === effectiveTemplateVendorId);
  const selectedTemplate = MOCK_TEMPLATES.find((t) => t.id === selectedTemplateId);
  const templateMaterials = selectedTemplate
    ? MOCK_MATERIALS.filter((m) => selectedTemplate.materialIds.includes(m.id))
    : [];

  // Totals
  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((s, li) => s + li.purchaseAmount, 0);
    const totalTax = lineItems.reduce((s, li) => s + li.totalTaxAmount, 0);
    const taxBreakdown: Record<string, number> = {};
    lineItems.forEach((li) => {
      li.taxes.forEach((t) => {
        taxBreakdown[t.taxName] = (taxBreakdown[t.taxName] ?? 0) + t.taxAmount;
      });
    });
    return { subtotal, totalTax, grandTotal: subtotal + totalTax, taxBreakdown };
  }, [lineItems]);

  const hasItems = lineItems.length > 0;
  const canGenerate = hasItems && !!selectedVendor && !!deliveryDate;

  // --- Handlers ---
  const handleVendorSelect = useCallback((vendorId: string) => {
    if (!vendorLocked) {
      setSelectedVendor(vendorId);
    }
  }, [vendorLocked]);

  const addMaterial = useCallback((material: (typeof MOCK_MATERIALS)[0]) => {
    if (lineItems.some((li) => li.materialId === material.id)) {
      toast({ title: "Already added", description: `${material.name} is already in the list.` });
      return;
    }
    const initialTaxes: TaxEntry[] = activeBulkTax
      ? [{ id: crypto.randomUUID(), taxTypeId: activeBulkTax.taxTypeId, taxName: activeBulkTax.taxName, taxRate: activeBulkTax.taxRate, taxAmount: 0 }]
      : [];
    const newItem: POLineItem = {
      id: crypto.randomUUID(),
      materialId: material.id,
      code: material.code,
      name: material.name,
      category: material.category,
      unit: material.primaryUnit,
      currentStock: material.currentStock,
      buyingPrice: material.buyingPrice,
      purchaseStock: 0,
      purchaseAmount: 0,
      taxes: initialTaxes,
      totalTaxAmount: 0,
      totalAmount: 0,
    };
    setLineItems((prev) => [newItem, ...prev]);
    setSearchQuery("");
  }, [lineItems, activeBulkTax]);

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
          toast({ title: "Tax already applied", description: `${tax.name} is already applied to this material.` });
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
    // Store as active bulk tax so new materials also get it applied
    setActiveBulkTax({ taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate });
    // Apply to all current materials
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

  // Template handler
  const addFromTemplate = () => {
    if (!selectedTemplateId) return;
    const template = MOCK_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (!template) return;
    const materialsToAdd = MOCK_MATERIALS.filter((m) => template.materialIds.includes(m.id));
    let added = 0;
    setLineItems((prev) => {
      const newItems = [...prev];
      materialsToAdd.forEach((material) => {
        if (newItems.some((li) => li.materialId === material.id)) return;
        newItems.unshift({
          id: crypto.randomUUID(),
          materialId: material.id,
          code: material.code,
          name: material.name,
          category: material.category,
          unit: material.primaryUnit,
          currentStock: material.currentStock,
          buyingPrice: material.buyingPrice,
          purchaseStock: 0,
          purchaseAmount: 0,
          taxes: [],
          totalTaxAmount: 0,
          totalAmount: 0,
        });
        added++;
      });
      return newItems;
    });
    setTemplateModalOpen(false);
    setSelectedTemplateId("");
    toast({ title: "Template applied", description: `${added} material(s) added from template.` });
  };

  const handleGenerate = () => {
    if (!deliveryDate) {
      setEddError(true);
      return;
    }
    setEddError(false);
    if (!hasItems || !selectedVendorData) return;
    const outletName = MOCK_OUTLETS.find((o) => o.id === selectedOutlet)?.name ?? "Unknown";
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
    addOrder({
      vendor: selectedVendorData.name,
      outlet: outletName,
      totalValue: totals.grandTotal,
      totalQty: lineItems.reduce((s, li) => s + li.purchaseStock, 0),
      createdBy: "Admin",
      createdOn: now,
      lastUpdated: now,
      status: "Raised",
      expectedDelivery: format(deliveryDate, "yyyy-MM-dd"),
      remarks,
      materials,
      poSubtotal: totals.subtotal,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
    });
    toast({ title: "PO Generated", description: "Purchase order has been raised." });
    navigate("/procurements/purchases", { state: { tab: "raised" } });
  };

  const handleDraft = () => {
    if (!hasItems || !selectedVendorData) return;
    const outletName = MOCK_OUTLETS.find((o) => o.id === selectedOutlet)?.name ?? "Unknown";
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
    addOrder({
      vendor: selectedVendorData.name,
      outlet: outletName,
      totalValue: totals.grandTotal,
      totalQty: lineItems.reduce((s, li) => s + li.purchaseStock, 0),
      createdBy: "Admin",
      createdOn: now,
      lastUpdated: now,
      status: "Drafted",
      expectedDelivery: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : undefined,
      remarks,
      materials,
      poSubtotal: totals.subtotal,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
    });
    toast({ title: "Draft saved", description: "Purchase order saved as draft." });
    navigate("/procurements/purchases", { state: { tab: "drafted" } });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 mb-6 flex-shrink-0">
        <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
          <FilePlus className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="cento-page-title">New Purchase Order</h2>
          <p className="cento-helper mt-0.5">Create a new purchase order</p>
        </div>
      </div>

      {/* ── ROW 1: Outlet | Vendor | EDD | Add from Template ── */}
      <div className="bg-card border border-border rounded-xl px-6 py-5 mb-6 flex-shrink-0 shadow-sm">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">

          {/* Select Outlet */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Select Outlet
            </Label>
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet} disabled={!isAdmin}>
              <SelectTrigger className="h-10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_OUTLETS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Vendor
              {vendorLocked && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground normal-case tracking-normal">(locked)</span>
              )}
            </Label>
            <VendorSearchDropdown
              selectedVendor={selectedVendor}
              onSelect={handleVendorSelect}
              locked={vendorLocked}
            />
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
            {eddError && (
              <p className="text-xs text-destructive">Expected Delivery Date is required.</p>
            )}
          </div>

          {/* Add from Template */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider opacity-0 select-none">
              Actions
            </Label>
            <Button
              variant="outline"
              className="h-10 bg-background flex items-center gap-2"
              disabled={!selectedVendor}
              onClick={() => {
                setTemplateVendorId(selectedVendor ?? "");
                setSelectedTemplateId("");
                setTemplateModalOpen(true);
              }}
            >
              <FileText className="h-4 w-4" />
              Add from Template
            </Button>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Material Search (shown when vendor selected) ── */}
      {selectedVendor && (
        <div className="mb-4 flex-shrink-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search and add materials..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {searchFocused && filteredMaterials.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[240px] overflow-auto">
                {filteredMaterials.map((m) => (
                  <button
                    key={m.id}
                    onMouseDown={() => addMaterial(m)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-sm hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-0"
                  >
                    <span className="text-muted-foreground font-mono text-xs w-16 flex-shrink-0">{m.code}</span>
                    <span className="font-medium flex-1 truncate">{m.name}</span>
                    <span className="text-xs text-muted-foreground">{m.category}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROW 3: Materials Table ── */}
      {selectedVendor ? (
        <div className="bg-card border border-border rounded-xl shadow-sm mb-8 flex-shrink-0 overflow-hidden">
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
                  {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-muted-foreground text-sm py-14">
                      Search for materials above to add them to this PO
                    </td>
                  </tr>
                )}
                {lineItems.map((item) => (
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
                          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors w-fit py-0.5"
                          onClick={() => openTaxModal(item.id)}
                        >
                          <Plus className="h-3 w-3" />
                          Add Tax
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
        /* Empty state when no vendor selected */
        <div className="bg-card border border-border rounded-xl shadow-sm flex items-center justify-center py-20 mb-8">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <FilePlus className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">Select a vendor to get started</p>
            <p className="text-xs text-muted-foreground mt-1">Choose a vendor above to begin adding materials</p>
          </div>
        </div>
      )}

      {/* ── ROW 4: PO Remarks + PO Summary + CTAs ── */}
      {selectedVendor && (
        <div className="flex gap-6 mb-8 flex-shrink-0 items-start">

          {/* PO Remarks — 60% */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex-[3]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">PO Remarks</p>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any notes or instructions for this purchase order..."
              className="min-h-[120px] resize-none bg-background text-sm border-border"
            />
          </div>

          {/* PO Summary + CTAs — 40% */}
          <div className="flex-[2] flex flex-col gap-4">
            {/* PO Summary Card */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">PO Summary</p>

              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Total Tax with collapsible breakdown */}
                <div>
                  <div className="flex justify-between items-center text-sm">
                    <button
                      onClick={() => setTaxBreakdownOpen((v) => !v)}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>Total Tax</span>
                      {Object.keys(totals.taxBreakdown).length > 0 && (
                        taxBreakdownOpen
                          ? <ChevronUp className="h-3.5 w-3.5" />
                          : <ChevronDown className="h-3.5 w-3.5" />
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

                  {!taxBreakdownOpen && Object.keys(totals.taxBreakdown).length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1 ml-0.5">No taxes applied</p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Grand Total */}
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
              <div className="flex gap-3 justify-end">
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
                  title={!canGenerate ? "Complete required fields to generate PO." : undefined}
                >
                  Generate PO
                </Button>
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
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TAX_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
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
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select tax type" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_TAX_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
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

      {/* ─── Add from Template Modal ─── */}
      <Dialog open={templateModalOpen} onOpenChange={setTemplateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Vendor</Label>
              {selectedVendor ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-muted border border-border text-sm">
                  <span className="font-medium text-foreground">{selectedVendorData?.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">(pre-filled from PO)</span>
                </div>
              ) : (
                <Select value={templateVendorId} onValueChange={(v) => { setTemplateVendorId(v); setSelectedTemplateId(""); }}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_VENDORS.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Template Name</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={!effectiveTemplateVendorId}
              >
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {vendorTemplates.length === 0
                    ? <SelectItem value="_none" disabled>No templates for this vendor</SelectItem>
                    : vendorTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>

            {templateMaterials.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Materials in Template</p>
                <div className="space-y-1.5">
                  {templateMaterials.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-muted-foreground w-14">{m.code}</span>
                      <span className="flex-1 font-medium">{m.name}</span>
                      <span className="text-muted-foreground">{m.primaryUnit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
            <Button variant="cento" disabled={!selectedTemplateId} onClick={addFromTemplate}>Add Materials</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
