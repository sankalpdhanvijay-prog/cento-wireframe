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
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  { id: "t1", name: "GST 5%", rate: 5 },
  { id: "t2", name: "GST 12%", rate: 12 },
  { id: "t3", name: "GST 18%", rate: 18 },
  { id: "t4", name: "GST 28%", rate: 28 },
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
  isTaxable: boolean;
  taxTypeId: string;
  taxAmount: number;
  totalAmount: number;
}

export default function NewPurchase() {
  const navigate = useNavigate();
  const { addOrder } = usePOStore();
  const [selectedOutlet, setSelectedOutlet] = useState("o1");
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [remarks, setRemarks] = useState("");
  const isAdmin = true; // mock role

  const selectedVendorData = MOCK_VENDORS.find((v) => v.id === selectedVendor);

  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MOCK_MATERIALS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const addMaterial = useCallback(
    (material: (typeof MOCK_MATERIALS)[0]) => {
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
        isTaxable: false,
        taxTypeId: "",
        taxAmount: 0,
        totalAmount: 0,
      };
      setLineItems((prev) => [newItem, ...prev]);
      setSearchQuery("");
    },
    [lineItems]
  );

  const removeItem = useCallback((id: string) => {
    setLineItems((prev) => prev.filter((li) => li.id !== id));
  }, []);

  const recalcRow = useCallback((item: POLineItem): POLineItem => {
    const purchaseAmount = item.buyingPrice * item.purchaseStock;
    let taxAmount = 0;
    if (item.isTaxable && item.taxTypeId) {
      const tax = MOCK_TAX_TYPES.find((t) => t.id === item.taxTypeId);
      if (tax) taxAmount = (purchaseAmount * tax.rate) / 100;
    }
    return {
      ...item,
      purchaseAmount,
      taxAmount,
      totalAmount: purchaseAmount + taxAmount,
    };
  }, []);

  const updateItem = useCallback(
    (id: string, updates: Partial<POLineItem>) => {
      setLineItems((prev) =>
        prev.map((li) => {
          if (li.id !== id) return li;
          const merged = { ...li, ...updates };
          // If untaxing, reset tax fields
          if (updates.isTaxable === false) {
            merged.taxTypeId = "";
            merged.taxAmount = 0;
          }
          return recalcRow(merged);
        })
      );
    },
    [recalcRow]
  );

  const totals = useMemo(() => {
    const purchaseTotal = lineItems.reduce((s, li) => s + li.purchaseAmount, 0);
    const taxTotal = lineItems.reduce((s, li) => s + li.taxAmount, 0);
    return { purchaseTotal, taxTotal, grandTotal: purchaseTotal + taxTotal };
  }, [lineItems]);

  const hasItems = lineItems.length > 0;

  return (
    <div className="flex flex-col h-full">
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

      {/* Two-panel layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* LEFT PANEL */}
        <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">
          {/* Outlet Selector */}
          <div className="cento-card">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Select Outlet
            </Label>
            <Select
              value={selectedOutlet}
              onValueChange={setSelectedOutlet}
              disabled={!isAdmin}
            >
              <SelectTrigger className="bg-card">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {MOCK_OUTLETS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vendor List */}
          <div className="cento-card flex-1 flex flex-col min-h-0 !p-3">
            <h3 className="cento-section-header mb-3 px-2">Vendors</h3>
            <ScrollArea className="flex-1">
              <div className="space-y-1.5">
                {MOCK_VENDORS.map((vendor) => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-all text-left",
                      selectedVendor === vendor.id
                        ? "bg-cento-yellow-tint-strong shadow-sm border border-border"
                        : "hover:bg-muted/60"
                    )}
                  >
                    <span className="truncate">{vendor.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* PO Remarks */}
          <div className="cento-card">
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
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {!selectedVendor ? (
            <div className="cento-card flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <FilePlus className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-foreground">Select a vendor</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a vendor from the list to start adding materials
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Vendor header + search + date */}
              <div className="flex items-end gap-3 mb-3 flex-shrink-0">
                {/* Search */}
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
                  {/* Search dropdown */}
                  {searchFocused && filteredMaterials.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[240px] overflow-auto">
                      {filteredMaterials.map((m) => (
                        <button
                          key={m.id}
                          onMouseDown={() => addMaterial(m)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors text-left"
                        >
                          <span className="text-muted-foreground font-mono text-xs w-16 flex-shrink-0">
                            {m.code}
                          </span>
                          <span className="font-medium truncate">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Delivery Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal bg-card",
                        !deliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deliveryDate
                        ? format(deliveryDate, "PPP")
                        : "Expected delivery"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deliveryDate}
                      onSelect={setDeliveryDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>

                {/* Vendor badge */}
                <div className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                  Vendor: <span className="font-medium text-foreground">{selectedVendorData?.name}</span>
                </div>
              </div>

              {/* Material Table */}
              <div className="cento-card flex-1 !p-0 min-h-0 overflow-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {[
                        "Code",
                        "Material",
                        "Category",
                        "Unit",
                        "Current Stock",
                        "Buying Price",
                        "Purchase Stock",
                        "Purchase Amt",
                        "Taxable",
                        "Tax Type",
                        "Tax Amt",
                        "Total Amt",
                        "",
                      ].map((h) => (
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
                    {lineItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {item.code}
                        </td>
                        <td className="px-3 py-2 font-medium whitespace-nowrap">
                          {item.name}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={item.category}
                            onValueChange={(val) => updateItem(item.id, { category: val })}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MOCK_CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={item.unit}
                            onValueChange={(val) => updateItem(item.id, { unit: val })}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs bg-card">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MOCK_UNITS.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-right">
                          {item.currentStock}
                        </td>
                        <td className="px-3 py-2 text-right">
                          ₹{item.buyingPrice.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={0}
                            value={item.purchaseStock || ""}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              updateItem(item.id, { purchaseStock: val });
                            }}
                            onBlur={() => updateItem(item.id, {})}
                            className="w-20 h-8 text-sm text-right bg-card"
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          ₹{item.purchaseAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Checkbox
                            checked={item.isTaxable}
                            onCheckedChange={(checked) =>
                              updateItem(item.id, { isTaxable: !!checked })
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={item.taxTypeId}
                            onValueChange={(val) =>
                              updateItem(item.id, { taxTypeId: val })
                            }
                            disabled={!item.isTaxable}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-28 h-8 text-xs bg-card",
                                !item.isTaxable && "opacity-40"
                              )}
                            >
                              <SelectValue placeholder="Tax" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOCK_TAX_TYPES.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          ₹{item.taxAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          ₹{item.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals + CTAs */}
              <div className="flex flex-col items-end mt-3 flex-shrink-0 gap-3">
                {/* Totals */}
                <div className="cento-card !py-5 !px-6 space-y-3 min-w-[360px]">
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">Purchase Total</span>
                    <span className="font-medium text-lg">₹{totals.purchaseTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">Total Tax</span>
                    <span className="font-medium text-lg">₹{totals.taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border my-2" />
                  <div className="flex justify-between text-lg font-semibold rounded-md bg-cento-yellow-tint px-3 py-2.5 -mx-1">
                    <span>Total Purchase Order</span>
                    <span className="text-xl">₹{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={!hasItems}
                    className={cn("bg-card", !hasItems && "opacity-40 cursor-not-allowed")}
                    onClick={() => {
                      if (!hasItems || !selectedVendorData) return;
                      const outletName = MOCK_OUTLETS.find((o) => o.id === selectedOutlet)?.name ?? "Unknown";
                      const now = format(new Date(), "yyyy-MM-dd");
                      const materials = lineItems.map((li) => {
                        const taxType = MOCK_TAX_TYPES.find((t) => t.id === li.taxTypeId);
                        return {
                          name: li.name,
                          orderedQty: li.purchaseStock,
                          unitPrice: li.buyingPrice,
                          taxPct: taxType?.rate ?? 0,
                          lineTotal: li.purchaseAmount,
                          receivedQty: 0,
                          pendingQty: li.purchaseStock,
                        };
                      });
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
                        poSubtotal: totals.purchaseTotal,
                        totalTax: totals.taxTotal,
                        grandTotal: totals.grandTotal,
                      });
                      toast({ title: "Draft saved", description: "Purchase order saved as draft." });
                      navigate("/procurements/all-orders");
                    }}
                  >
                    Draft
                  </Button>
                  <Button
                    variant="cento"
                    disabled={!hasItems}
                    className={cn(!hasItems && "opacity-40 cursor-not-allowed")}
                  >
                    Generate
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
