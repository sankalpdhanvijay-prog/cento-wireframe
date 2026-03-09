import React, { createContext, useContext, useState, useCallback } from "react";
import { format } from "date-fns";

/* ───── Shared Types ───── */
export type POStatus = "Drafted" | "Raised" | "Approved" | "Partially Received" | "Received" | "Closed" | "Rejected";

export interface POLineItem {
  name: string;
  orderedQty: number;
  unitPrice: number;
  taxPct: number;
  lineTotal: number;
  receivedQty: number;
  pendingQty: number;
  code?: string;
}

export type SupplierType = "Vendor" | "Outlet";

export interface PurchaseOrder {
  id: string;
  vendor: string;
  outlet: string;
  supplierType: SupplierType;
  totalValue: number;
  totalQty: number;
  receivedQty?: number;
  pendingQty?: number;
  createdBy: string;
  createdOn: string;
  approvedOn?: string;
  approvedBy?: string;
  prnId?: string;
  lastUpdated?: string;
  lastReceivingDate?: string;
  closedDate?: string;
  closedBy?: string;
  rejectedOn?: string;
  rejectedBy?: string;
  status: POStatus;
  expectedDelivery?: string;
  remarks?: string;
  materials: POLineItem[];
  poSubtotal: number;
  totalTax: number;
  grandTotal: number;
  invoiceValueReceived?: number;
  invoiceTaxReceived?: number;
  outstandingValue?: number;
  otherCharges?: number;
  taxBreakdown?: Record<string, number>;
}

/* ───── Seed data ───── */
const SEED_ORDERS: PurchaseOrder[] = [
  {
    id: "PO-1001", vendor: "Sysco Foods", outlet: "Main Kitchen", supplierType: "Vendor", totalValue: 24500, totalQty: 120,
    createdBy: "Ankit", createdOn: "2026-02-01", lastUpdated: "2026-02-02", status: "Drafted",
    expectedDelivery: "2026-02-10",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 50, unitPrice: 220, taxPct: 5, lineTotal: 11000, receivedQty: 0, pendingQty: 50, code: "RM-001" },
      { name: "Sunflower Oil 15L", orderedQty: 30, unitPrice: 350, taxPct: 12, lineTotal: 10500, receivedQty: 0, pendingQty: 30, code: "RM-002" },
      { name: "Wheat Flour 50kg", orderedQty: 40, unitPrice: 75, taxPct: 5, lineTotal: 3000, receivedQty: 0, pendingQty: 40, code: "RM-008" },
    ],
    poSubtotal: 24500, totalTax: 1765, grandTotal: 26265,
  },
  {
    id: "PO-1002", vendor: "US Foods", outlet: "Central Warehouse", supplierType: "Vendor", totalValue: 18200, totalQty: 85,
    createdBy: "Meera", createdOn: "2026-02-03", lastUpdated: "2026-02-04", status: "Drafted",
    materials: [
      { name: "Olive Oil 5L", orderedQty: 25, unitPrice: 480, taxPct: 12, lineTotal: 12000, receivedQty: 0, pendingQty: 25, code: "RM-002" },
      { name: "Black Pepper 1kg", orderedQty: 60, unitPrice: 103.33, taxPct: 5, lineTotal: 6200, receivedQty: 0, pendingQty: 60, code: "RM-012" },
    ],
    poSubtotal: 18200, totalTax: 1750, grandTotal: 19950,
  },
  {
    id: "PO-1003", vendor: "Metro Supply", outlet: "Main Kitchen", supplierType: "Vendor", totalValue: 31000, totalQty: 200,
    createdBy: "Ankit", createdOn: "2026-01-28", status: "Raised", expectedDelivery: "2026-02-08",
    materials: [
      { name: "Tomato Paste 5kg", orderedQty: 80, unitPrice: 150, taxPct: 12, lineTotal: 12000, receivedQty: 0, pendingQty: 80, code: "RM-005" },
      { name: "Chickpeas 25kg", orderedQty: 60, unitPrice: 180, taxPct: 5, lineTotal: 10800, receivedQty: 0, pendingQty: 60 },
      { name: "Salt 50kg", orderedQty: 60, unitPrice: 136.67, taxPct: 5, lineTotal: 8200, receivedQty: 0, pendingQty: 60 },
    ],
    poSubtotal: 31000, totalTax: 2490, grandTotal: 33490,
  },
  {
    id: "PO-1004", vendor: "Fresh Direct", outlet: "Central Warehouse", supplierType: "Outlet", totalValue: 12750, totalQty: 60,
    createdBy: "Meera", createdOn: "2026-01-25", status: "Raised",
    materials: [
      { name: "Fresh Tomatoes 10kg", orderedQty: 30, unitPrice: 250, taxPct: 0, lineTotal: 7500, receivedQty: 0, pendingQty: 30 },
      { name: "Onions 25kg", orderedQty: 30, unitPrice: 175, taxPct: 0, lineTotal: 5250, receivedQty: 0, pendingQty: 30 },
    ],
    poSubtotal: 12750, totalTax: 0, grandTotal: 12750,
  },
  {
    id: "PO-1005", vendor: "Sysco Foods", outlet: "Main Kitchen", supplierType: "Vendor", totalValue: 42000, totalQty: 310,
    createdBy: "Raj", createdOn: "2026-01-20", status: "Approved", expectedDelivery: "2026-02-01",
    approvedOn: "2026-01-22", approvedBy: "Admin", prnId: "PRN-PO-1005",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 100, unitPrice: 220, taxPct: 5, lineTotal: 22000, receivedQty: 0, pendingQty: 100, code: "RM-001" },
      { name: "Sugar 50kg", orderedQty: 80, unitPrice: 125, taxPct: 5, lineTotal: 10000, receivedQty: 0, pendingQty: 80 },
      { name: "Turmeric Powder 5kg", orderedQty: 130, unitPrice: 76.92, taxPct: 12, lineTotal: 10000, receivedQty: 0, pendingQty: 130 },
    ],
    poSubtotal: 42000, totalTax: 2800, grandTotal: 44800,
  },
  {
    id: "PO-1006", vendor: "Metro Supply", outlet: "South Outlet", supplierType: "Vendor", totalValue: 9500, totalQty: 55,
    createdBy: "Ankit", createdOn: "2026-01-18", status: "Approved",
    approvedOn: "2026-01-20", approvedBy: "Admin", prnId: "PRN-PO-1006",
    materials: [
      { name: "Coriander Powder 1kg", orderedQty: 55, unitPrice: 172.73, taxPct: 5, lineTotal: 9500, receivedQty: 0, pendingQty: 55, code: "RM-006" },
    ],
    poSubtotal: 9500, totalTax: 475, grandTotal: 9975,
  },
  {
    id: "PO-1007", vendor: "US Foods", outlet: "Main Kitchen", supplierType: "Vendor", totalValue: 38000, totalQty: 250,
    receivedQty: 180, pendingQty: 70, createdBy: "Meera", createdOn: "2026-01-10",
    lastUpdated: "2026-02-05", status: "Partially Received",
    approvedOn: "2026-01-12", approvedBy: "Admin", prnId: "PRN-PO-1007",
    materials: [
      { name: "Pasta 5kg", orderedQty: 100, unitPrice: 180, taxPct: 12, lineTotal: 18000, receivedQty: 80, pendingQty: 20, code: "RM-003" },
      { name: "Cheese Block 5kg", orderedQty: 80, unitPrice: 150, taxPct: 12, lineTotal: 12000, receivedQty: 60, pendingQty: 20, code: "RM-007" },
      { name: "Cream 5L", orderedQty: 70, unitPrice: 114.29, taxPct: 12, lineTotal: 8000, receivedQty: 40, pendingQty: 30 },
    ],
    poSubtotal: 38000, totalTax: 4560, grandTotal: 42560,
    invoiceValueReceived: 27600, invoiceTaxReceived: 3312, outstandingValue: 11688,
  },
  {
    id: "PO-1008", vendor: "Fresh Direct", outlet: "Central Warehouse", supplierType: "Outlet", totalValue: 15000, totalQty: 100,
    receivedQty: 60, pendingQty: 40, createdBy: "Raj", createdOn: "2026-01-08",
    lastReceivingDate: "2026-02-03", status: "Partially Received",
    approvedOn: "2026-01-10", approvedBy: "Admin", prnId: "PRN-PO-1008",
    materials: [
      { name: "Fresh Spinach 5kg", orderedQty: 50, unitPrice: 160, taxPct: 0, lineTotal: 8000, receivedQty: 30, pendingQty: 20 },
      { name: "Carrots 10kg", orderedQty: 50, unitPrice: 140, taxPct: 0, lineTotal: 7000, receivedQty: 30, pendingQty: 20 },
    ],
    poSubtotal: 15000, totalTax: 0, grandTotal: 15000,
    invoiceValueReceived: 9000, invoiceTaxReceived: 0, outstandingValue: 6000,
  },
  {
    id: "PO-1009", vendor: "Sysco Foods", outlet: "Main Kitchen", supplierType: "Vendor", totalValue: 27500, totalQty: 150,
    receivedQty: 150, createdBy: "Ankit", createdOn: "2025-12-20", status: "Closed",
    closedDate: "2026-01-15", closedBy: "Meera",
    approvedOn: "2025-12-22", approvedBy: "Admin", prnId: "PRN-PO-1009",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 80, unitPrice: 220, taxPct: 5, lineTotal: 17600, receivedQty: 80, pendingQty: 0, code: "RM-001" },
      { name: "Lentils 25kg", orderedQty: 70, unitPrice: 141.43, taxPct: 5, lineTotal: 9900, receivedQty: 70, pendingQty: 0 },
    ],
    poSubtotal: 27500, totalTax: 1375, grandTotal: 28875,
    invoiceValueReceived: 27500, invoiceTaxReceived: 1375, outstandingValue: 0,
  },
  {
    id: "PO-1010", vendor: "Metro Supply", outlet: "South Outlet", supplierType: "Vendor", totalValue: 11200, totalQty: 75,
    receivedQty: 75, createdBy: "Raj", createdOn: "2025-12-15", status: "Closed",
    closedDate: "2026-01-10", closedBy: "Ankit",
    approvedOn: "2025-12-17", approvedBy: "Admin", prnId: "PRN-PO-1010",
    materials: [
      { name: "Red Chilli Powder 1kg", orderedQty: 75, unitPrice: 149.33, taxPct: 5, lineTotal: 11200, receivedQty: 75, pendingQty: 0 },
    ],
    poSubtotal: 11200, totalTax: 560, grandTotal: 11760,
    invoiceValueReceived: 11200, invoiceTaxReceived: 560, outstandingValue: 0,
  },
  {
    id: "PO-1011", vendor: "US Foods", outlet: "Central Warehouse", supplierType: "Vendor", totalValue: 8900, totalQty: 40,
    createdBy: "Meera", createdOn: "2025-12-10", status: "Rejected",
    rejectedOn: "2025-12-12", rejectedBy: "Ankit",
    materials: [
      { name: "Soy Sauce 1L", orderedQty: 40, unitPrice: 222.5, taxPct: 12, lineTotal: 8900, receivedQty: 0, pendingQty: 40 },
    ],
    poSubtotal: 8900, totalTax: 1068, grandTotal: 9968,
  },
  {
    id: "PO-1012", vendor: "Fresh Direct", outlet: "Main Kitchen", supplierType: "Outlet", totalValue: 6200, totalQty: 30,
    createdBy: "Raj", createdOn: "2025-12-05", status: "Rejected",
    rejectedOn: "2025-12-06", rejectedBy: "Meera",
    materials: [
      { name: "Bell Peppers 5kg", orderedQty: 30, unitPrice: 206.67, taxPct: 0, lineTotal: 6200, receivedQty: 0, pendingQty: 30 },
    ],
    poSubtotal: 6200, totalTax: 0, grandTotal: 6200,
  },
];

/* ───── Context ───── */
interface POStoreContextType {
  orders: PurchaseOrder[];
  addOrder: (order: Omit<PurchaseOrder, "id">) => string;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (id: string, status: POStatus) => void;
  getOrder: (id: string) => PurchaseOrder | undefined;
}

const POStoreContext = createContext<POStoreContextType | null>(null);

let nextId = 1013;

export function POStoreProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(SEED_ORDERS);

  const addOrder = useCallback((order: Omit<PurchaseOrder, "id">) => {
    const id = `PO-${nextId++}`;
    setOrders((prev) => [{ ...order, id } as PurchaseOrder, ...prev]);
    return id;
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const updateOrderStatus = useCallback((id: string, status: POStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const now = format(new Date(), "yyyy-MM-dd");
        const updates: Partial<PurchaseOrder> = { status, lastUpdated: now };
        if (status === "Approved") {
          updates.approvedOn = now;
          updates.approvedBy = "Admin";
          updates.prnId = `PRN-${o.id}`;
        }
        if (status === "Rejected") {
          updates.rejectedOn = now;
          updates.rejectedBy = "Admin";
        }
        if (status === "Closed") {
          updates.closedDate = now;
          updates.closedBy = "Admin";
        }
        return { ...o, ...updates };
      })
    );
  }, []);

  const getOrder = useCallback((id: string) => {
    return orders.find((o) => o.id === id);
  }, [orders]);

  return (
    <POStoreContext.Provider value={{ orders, addOrder, deleteOrder, updateOrderStatus, getOrder }}>
      {children}
    </POStoreContext.Provider>
  );
}

export function usePOStore() {
  const ctx = useContext(POStoreContext);
  if (!ctx) throw new Error("usePOStore must be used within POStoreProvider");
  return ctx;
}
