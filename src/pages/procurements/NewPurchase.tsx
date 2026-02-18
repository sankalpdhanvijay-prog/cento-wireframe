import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  FilePlus,
  Search,
  ChevronRight,
  Trash2,
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  FileText,
  Tag,
  X,
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { usePOStore } from "@/context/POStoreContext";

// --- Mock Data ---
const MOCK_VENDORS = [
  { id: "v1", name: "Fresh Farms Pvt Ltd" },
  { id: "v2", name: "Spice World Traders" },
  { id: "v3", name: "Daily Dairy Supplies" },
  { id: "v4", name: "Ocean Catch Seafoods" },
  { id: "v5", name: "Green Valley Produce" },
  { id: "v6", name: "Metro Packaging Co." },
  { id: "v7", name: "Baker's Delight Ingredients" },
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

export default function NewPurchase() {
  const navigate = useNavigate();
  const { addOrder } = usePOStore();
  const isAdmin = true;

  // Core state
  const [selectedOutlet, setSelectedOutlet] = useState("o1");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vendorSearch, setVendorSearch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [eddError, setEddError] = useState(false);
  const [remarks, setRemarks] = useState("");

  // Dialog states
  const [vendorChangeDialogOpen, setVendorChangeDialogOpen] = useState(false);
  const [pendingVendorId, setPendingVendorId] = useState<string | null>(null);
  const [taxModalItemId, setTaxModalItemId] = useState<string | null>(null);
  const [taxModalTaxTypeId, setTaxModalTaxTypeId] = useState("");
  const [bulkTaxModalOpen, setBulkTaxModalOpen] = useState(false);
  const [bulkTaxTypeId, setBulkTaxTypeId] = useState("");
  const [bulkApplyMode, setBulkApplyMode] = useState<"all" | "without" | "overwrite">("all");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateVendorId, setTemplateVendorId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [taxBreakdownOpen, setTaxBreakdownOpen] = useState(false);

  // Derived
  const filteredVendors = useMemo(() => {
    if (!vendorSearch.trim()) return MOCK_VENDORS;
    const q = vendorSearch.toLowerCase();
    return MOCK_VENDORS.filter((v) => v.name.toLowerCase().includes(q));
  }, [vendorSearch]);

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
    // Aggregate taxes by name
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
  const handleVendorClick = useCallback((vendorId: string) => {
    if (selectedVendor && selectedVendor !== vendorId && lineItems.length > 0) {
      setPendingVendorId(vendorId);
      setVendorChangeDialogOpen(true);
    } else {
      setSelectedVendor(vendorId);
    }
  }, [selectedVendor, lineItems.length]);

  const confirmVendorChange = useCallback(() => {
    if (pendingVendorId) {
      setLineItems([]);
      setSelectedVendor(pendingVendorId);
      setPendingVendorId(null);
    }
    setVendorChangeDialogOpen(false);
  }, [pendingVendorId]);

  const addMaterial = useCallback((material: (typeof MOCK_MATERIALS)[0]) => {
    if (lineItems.some((li) => li.materialId === material.id)) {
      toast({ title: "Already added", description: `${material.name} is already in the list.` });
      return;
    }
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
      taxes: [],
      totalTaxAmount: 0,
      totalAmount: 0,
    };
    setLineItems((prev) => [newItem, ...prev]);
    setSearchQuery("");
  }, [lineItems]);

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
        // Prevent duplicate tax type
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
    setLineItems((prev) =>
      prev.map((li) => {
        let taxes = [...li.taxes];
        if (bulkApplyMode === "all" || bulkApplyMode === "overwrite") {
          if (bulkApplyMode === "overwrite") taxes = [];
          if (!taxes.some((t) => t.taxTypeId === tax.id)) {
            taxes = [...taxes, { id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate, taxAmount: 0 }];
          }
        } else if (bulkApplyMode === "without") {
          if (li.taxes.length === 0) {
            taxes = [{ id: crypto.randomUUID(), taxTypeId: tax.id, taxName: tax.name, taxRate: tax.rate, taxAmount: 0 }];
          }
        }
        return recalcItemTaxes({ ...li, taxes });
      })
    );
    setBulkTaxModalOpen(false);
    setBulkTaxTypeId("");
    toast({ title: "Tax applied", description: `${tax.name} ${tax.rate}% applied to materials.` });
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
    navigate("/procurements/all-orders");
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
    navigate("/procurements/all-orders");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
          <FilePlus className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="cento-page-title">New Purchase Order</h2>
          <p className="cento-helper mt-0.5">Create a new purchase order</p>
        </div>
      </div>

      {/* ROW 1: Outlet + Vendor side by side */}
      <div className="flex gap-4 mb-4 flex-shrink-0">
        {/* Outlet Selector */}
        <div className="cento-card w-[260px] flex-shrink-0">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            Select Outlet
          </Label>
          <Select value={selectedOutlet} onValueChange={setSelectedOutlet} disabled={!isAdmin}>
            <SelectTrigger className="bg-card">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {MOCK_OUTLETS.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vendor selector */}
        <div className="cento-card flex-1 !p-3 flex flex-col">
          <h3 className="cento-section-header mb-2 px-1">Vendor</h3>
          <div className="flex gap-3 items-start">
            {/* Search */}
            <div className="relative w-56 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                placeholder="Search vendors..."
                className="pl-8 h-8 text-xs bg-card"
              />
            </div>
            {/* Vendor chips row */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {filteredVendors.map((vendor) => (
                <button
                  key={vendor.id}
                  onClick={() => handleVendorClick(vendor.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border",
                    selectedVendor === vendor.id
                      ? "bg-cento-yellow-tint-strong border-border shadow-sm text-foreground"
                      : "bg-card border-border hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {vendor.name}
                  {selectedVendor === vendor.id && <ChevronRight className="h-3 w-3" />}
                </button>
              ))}
              {filteredVendors.length === 0 && (
                <p className="text-xs text-muted-foreground py-1">No vendors found</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: Action bar — shown once vendor is selected */}
      {selectedVendor && (
        <div className="flex items-end gap-3 mb-3 flex-shrink-0 flex-wrap">
          {/* Material Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Search materials..."
              className="pl-9 bg-card"
            />
            {searchFocused && filteredMaterials.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[240px] overflow-auto">
                {filteredMaterials.map((m) => (
                  <button
                    key={m.id}
                    onMouseDown={() => addMaterial(m)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                  >
                    <span className="text-muted-foreground font-mono text-xs w-16 flex-shrink-0">{m.code}</span>
                    <span className="font-medium truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add from Template */}
          <Button
            variant="outline"
            size="sm"
            className="bg-card flex items-center gap-1.5"
            onClick={() => {
              setTemplateVendorId(selectedVendor ?? "");
              setSelectedTemplateId("");
              setTemplateModalOpen(true);
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Add from Template
          </Button>

          {/* EDD */}
          <div className="flex flex-col gap-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[210px] justify-start text-left font-normal bg-card",
                    !deliveryDate && "text-muted-foreground",
                    eddError && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP") : (
                    <span>Expected Delivery Date <span className="text-destructive">*</span></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
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

          {/* Selected vendor badge */}
          <div className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cento-yellow-tint text-xs font-medium text-foreground border border-border">
            <span className="text-muted-foreground">Vendor:</span>
            <span>{selectedVendorData?.name}</span>
          </div>
        </div>
      )}

      {/* ROW 3: Materials Table — full width */}
      {selectedVendor ? (
        <div className="cento-card !p-0 flex-shrink-0 mb-4">
          {/* Table header */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Materials ({lineItems.length})
            </span>
            {hasItems && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 bg-card"
                onClick={() => { setBulkTaxTypeId(""); setBulkApplyMode("all"); setBulkTaxModalOpen(true); }}
              >
                <Tag className="h-3 w-3" />
                Apply Tax to All
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="border-b bg-muted/20">
                  {["Code", "Material", "Category", "Unit", "Current Stock", "Buying Price", "Purchase Stock", "Purchase Amt", "Taxes", "Total Amt", ""].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-muted-foreground text-sm py-10">
                      Search for materials above to add them to this PO
                    </td>
                  </tr>
                )}
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors align-top">
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground whitespace-nowrap pt-3">{item.code}</td>
                    <td className="px-3 py-2 font-medium whitespace-nowrap pt-3">{item.name}</td>
                    <td className="px-3 py-2">
                      <Select value={item.category} onValueChange={(val) => updateItem(item.id, { category: val })}>
                        <SelectTrigger className="w-28 h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MOCK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Select value={item.unit} onValueChange={(val) => updateItem(item.id, { unit: val })}>
                        <SelectTrigger className="w-24 h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {MOCK_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-right pt-3">{item.currentStock}</td>
                    <td className="px-3 py-2 text-right pt-3">₹{item.buyingPrice.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={0}
                        value={item.purchaseStock || ""}
                        onChange={(e) => updateItem(item.id, { purchaseStock: parseFloat(e.target.value) || 0 })}
                        className="w-20 h-8 text-sm text-right bg-card"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium pt-3">₹{item.purchaseAmount.toFixed(2)}</td>

                    {/* Taxes column */}
                    <td className="px-3 py-2 min-w-[160px]">
                      <div className="flex flex-col gap-1">
                        {item.taxes.map((t) => (
                          <div key={t.id} className="flex items-center gap-1 group">
                            <Badge variant="secondary" className="text-xs font-normal gap-1 pr-1">
                              {t.taxName} {t.taxRate}%
                              <button
                                onClick={() => removeTaxFromItem(item.id, t.id)}
                                className="ml-0.5 opacity-50 hover:opacity-100"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </Badge>
                            <span className="text-xs text-muted-foreground">₹{t.taxAmount.toFixed(0)}</span>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs justify-start px-2 text-primary hover:text-primary/80 w-fit"
                          onClick={() => openTaxModal(item.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Tax
                        </Button>
                      </div>
                    </td>

                    <td className="px-3 py-2 text-right font-semibold pt-3">₹{item.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 pt-2">
                      <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-4 w-4 text-destructive" />
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
        <div className="cento-card flex items-center justify-center py-16 mb-4">
          <div className="text-center">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
              <FilePlus className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-foreground">Select a vendor to get started</p>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a vendor above to begin adding materials
            </p>
          </div>
        </div>
      )}

      {/* ROW 4: PO Remarks + PO Summary */}
      {selectedVendor && (
        <div className="flex gap-4 mb-6 flex-shrink-0 items-start">
          {/* PO Remarks */}
          <div className="cento-card flex-1">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              PO Remarks
            </Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add remarks for this purchase order..."
              className="min-h-[80px] resize-none bg-card text-sm"
            />
          </div>

          {/* PO Summary + CTAs */}
          <div className="flex flex-col gap-3 min-w-[380px]">
            <div className="cento-card !py-5 !px-6 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">📦 PO Summary</p>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Total Tax with collapsible breakdown */}
              <div>
                <div className="flex justify-between text-sm items-center">
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
                  <span className="font-medium">₹{totals.totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {taxBreakdownOpen && Object.keys(totals.taxBreakdown).length > 0 && (
                  <div className="mt-1.5 ml-3 space-y-1 border-l-2 border-border pl-3">
                    {Object.entries(totals.taxBreakdown).map(([name, amt]) => (
                      <div key={name} className="flex justify-between text-xs text-muted-foreground">
                        <span>{name}</span>
                        <span>→ ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(totals.taxBreakdown).length === 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 ml-1">No taxes applied</p>
                )}
              </div>

              <div className="border-t border-border my-1" />
              <div className="flex justify-between text-lg font-bold rounded-md bg-cento-yellow-tint px-3 py-2.5 -mx-1">
                <span>Total PO Amount</span>
                <span className="text-xl">₹{totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex gap-2 items-center justify-end">
              {!deliveryDate && (
                <p className="text-xs text-muted-foreground mr-1">Complete required fields to generate PO.</p>
              )}
              <Button
                variant="outline"
                disabled={!hasItems}
                className={cn("bg-card", !hasItems && "opacity-40 cursor-not-allowed")}
                onClick={handleDraft}
              >
                Draft
              </Button>
              <Button
                variant="cento"
                disabled={!canGenerate}
                className={cn(!canGenerate && "opacity-40 cursor-not-allowed")}
                onClick={handleGenerate}
                title={!canGenerate ? "Complete required fields to generate PO." : undefined}
              >
                Generate PO
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* ─── Vendor Change Warning Dialog ─── */}
      <AlertDialog open={vendorChangeDialogOpen} onOpenChange={setVendorChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the vendor will remove all added materials and reset pricing. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setVendorChangeDialogOpen(false); setPendingVendorId(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVendorChange}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Change Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Add Tax Modal ─── */}
      <Dialog open={!!taxModalItemId} onOpenChange={(open) => { if (!open) { setTaxModalItemId(null); setTaxModalTaxTypeId(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Tax — {taxModalItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Tax Name
              </Label>
              <Select value={taxModalTaxTypeId} onValueChange={setTaxModalTaxTypeId}>
                <SelectTrigger className="bg-card">
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
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                  Tax Value (%)
                </Label>
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
                <SelectTrigger className="bg-card">
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
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Apply To</Label>
              <RadioGroup value={bulkApplyMode} onValueChange={(v) => setBulkApplyMode(v as typeof bulkApplyMode)} className="space-y-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="bulk-all" />
                  <Label htmlFor="bulk-all" className="text-sm font-normal cursor-pointer">All materials</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="without" id="bulk-without" />
                  <Label htmlFor="bulk-without" className="text-sm font-normal cursor-pointer">Only materials without tax</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="overwrite" id="bulk-overwrite" />
                  <Label htmlFor="bulk-overwrite" className="text-sm font-normal cursor-pointer">Overwrite existing taxes</Label>
                </div>
              </RadioGroup>
            </div>
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
            {/* Vendor — locked if already selected */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Vendor</Label>
              {selectedVendor ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedVendorData?.name}</span>
                  <span className="text-xs">(pre-filled from PO)</span>
                </div>
              ) : (
                <Select value={templateVendorId} onValueChange={(v) => { setTemplateVendorId(v); setSelectedTemplateId(""); }}>
                  <SelectTrigger className="bg-card"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {MOCK_VENDORS.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Template Name */}
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Template Name</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
                disabled={!effectiveTemplateVendorId}
              >
                <SelectTrigger className="bg-card"><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {vendorTemplates.length === 0
                    ? <SelectItem value="_none" disabled>No templates for this vendor</SelectItem>
                    : vendorTemplates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>

            {/* Template preview */}
            {templateMaterials.length > 0 && (
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Materials in Template
                </p>
                <div className="space-y-1">
                  {templateMaterials.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
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
