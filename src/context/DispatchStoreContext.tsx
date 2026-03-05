import React, { createContext, useContext, useState, useCallback } from "react";
import { format } from "date-fns";

export type DispatchStatus = "In Transit" | "Closed" | "Closed (Partial)" | "Deleted";

export interface DispatchLineItem {
  name: string;
  dispatchQty: number;
  unitPrice: number;
  taxPct: number;
  lineTotal: number;
}

export interface NewDispatchItem {
  requisitionId: string;
  type: "PO" | "TO";
  raisedBy: string;
  orderedQty: number;
  totalValue: number;
  requisitionDate: string;
  expectedDeliveryDate: string;
  lastUpdated: string;
}

export interface PartialDispatchItem {
  requisitionId: string;
  type: "PO" | "TO";
  raisedBy: string;
  orderedQty: number;
  pendingQty: number;
  receivedQty: number;
  totalValue: number;
  requisitionDate: string;
  expectedDeliveryDate: string;
}

export interface DispatchOrder {
  id: string;
  requisitionId: string;
  type: "PO" | "TO";
  supplierType?: "Vendor" | "Outlet";
  vendor?: string;
  outlet?: string;
  deliverTo: string;
  dispatchDate: string;
  grnId?: string;
  invoiceId?: string;
  invoiceAmount?: number;
  status: DispatchStatus;
  createdBy: string;
  materials: DispatchLineItem[];
  subtotal: number;
  totalTax: number;
  otherCharges: number;
  grandTotal: number;
}

const SEED_NEW_DISPATCHES: NewDispatchItem[] = [
  { requisitionId: "PO-1003", type: "PO", raisedBy: "Main Kitchen", orderedQty: 200, totalValue: 31000, requisitionDate: "2026-01-28", expectedDeliveryDate: "2026-02-08", lastUpdated: "2026-01-28" },
  { requisitionId: "PO-1005", type: "PO", raisedBy: "Main Kitchen", orderedQty: 350, totalValue: 42000, requisitionDate: "2026-01-20", expectedDeliveryDate: "2026-02-01", lastUpdated: "2026-01-20" },
  { requisitionId: "TO-2003", type: "TO", raisedBy: "Branch - Koramangala", orderedQty: 150, totalValue: 22000, requisitionDate: "2026-02-05", expectedDeliveryDate: "2026-02-12", lastUpdated: "2026-02-05" },
  { requisitionId: "TO-2005", type: "TO", raisedBy: "Central Warehouse", orderedQty: 120, totalValue: 18000, requisitionDate: "2026-01-28", expectedDeliveryDate: "2026-02-05", lastUpdated: "2026-01-28" },
];

const SEED_PARTIAL_DISPATCHES: PartialDispatchItem[] = [
  { requisitionId: "PO-1001", type: "PO", raisedBy: "Main Kitchen", orderedQty: 300, pendingQty: 120, receivedQty: 180, totalValue: 55000, requisitionDate: "2026-01-10", expectedDeliveryDate: "2026-01-25" },
  { requisitionId: "PO-1002", type: "PO", raisedBy: "Branch - Indiranagar", orderedQty: 250, pendingQty: 90, receivedQty: 160, totalValue: 38000, requisitionDate: "2026-01-15", expectedDeliveryDate: "2026-01-30" },
  { requisitionId: "TO-2001", type: "TO", raisedBy: "Central Warehouse", orderedQty: 200, pendingQty: 75, receivedQty: 125, totalValue: 28000, requisitionDate: "2026-01-18", expectedDeliveryDate: "2026-02-01" },
];

const SEED_DISPATCHES: DispatchOrder[] = [
  {
    id: "GDN-3001", requisitionId: "PO-1009", type: "PO", supplierType: "Vendor", vendor: "Sysco Foods", deliverTo: "Main Kitchen",
    dispatchDate: "2026-01-10", grnId: "GRN-001", invoiceId: "INV-501", invoiceAmount: 28875, status: "Closed",
    createdBy: "Admin",
    materials: [
      { name: "Basmati Rice 25kg", dispatchQty: 80, unitPrice: 220, taxPct: 5, lineTotal: 17600 },
      { name: "Lentils 25kg", dispatchQty: 70, unitPrice: 141.43, taxPct: 5, lineTotal: 9900 },
    ],
    subtotal: 27500, totalTax: 1375, otherCharges: 0, grandTotal: 28875,
  },
  {
    id: "GDN-3002", requisitionId: "PO-1007", type: "PO", supplierType: "Vendor", vendor: "US Foods", deliverTo: "Main Kitchen",
    dispatchDate: "2026-02-01", grnId: "GRN-002", status: "In Transit",
    createdBy: "Admin",
    materials: [
      { name: "Pasta 5kg", dispatchQty: 80, unitPrice: 180, taxPct: 12, lineTotal: 14400 },
      { name: "Cheese Block 5kg", dispatchQty: 60, unitPrice: 150, taxPct: 12, lineTotal: 9000 },
    ],
    subtotal: 23400, totalTax: 2808, otherCharges: 0, grandTotal: 26208,
  },
  {
    id: "GDN-3003", requisitionId: "TO-2005", type: "TO", deliverTo: "Central Warehouse",
    dispatchDate: "2026-01-30", grnId: "GRN-003", invoiceId: "INV-503", invoiceAmount: 18000, status: "Closed (Partial)",
    createdBy: "Admin",
    materials: [
      { name: "Basmati Rice 25kg", dispatchQty: 50, unitPrice: 200, taxPct: 0, lineTotal: 10000 },
      { name: "Cumin Powder", dispatchQty: 50, unitPrice: 160, taxPct: 0, lineTotal: 8000 },
    ],
    subtotal: 18000, totalTax: 0, otherCharges: 0, grandTotal: 18000,
  },
];

interface DispatchStoreContextType {
  newDispatches: NewDispatchItem[];
  partialDispatches: PartialDispatchItem[];
  dispatches: DispatchOrder[];
  addDispatch: (order: Omit<DispatchOrder, "id">) => string;
  deleteDispatch: (id: string) => void;
  updateDispatchStatus: (id: string, status: DispatchStatus) => void;
  getDispatch: (id: string) => DispatchOrder | undefined;
  removeNewDispatch: (requisitionId: string) => void;
}

const DispatchStoreContext = createContext<DispatchStoreContextType | null>(null);

let nextGdnId = 3004;

export function DispatchStoreProvider({ children }: { children: React.ReactNode }) {
  const [newDispatches, setNewDispatches] = useState<NewDispatchItem[]>(SEED_NEW_DISPATCHES);
  const [partialDispatches] = useState<PartialDispatchItem[]>(SEED_PARTIAL_DISPATCHES);
  const [dispatches, setDispatches] = useState<DispatchOrder[]>(SEED_DISPATCHES);

  const addDispatch = useCallback((order: Omit<DispatchOrder, "id">) => {
    const id = `GDN-${nextGdnId++}`;
    setDispatches((prev) => [{ ...order, id } as DispatchOrder, ...prev]);
    return id;
  }, []);

  const deleteDispatch = useCallback((id: string) => {
    setDispatches((prev) => prev.map((d) => d.id === id ? { ...d, status: "Deleted" as DispatchStatus } : d));
  }, []);

  const updateDispatchStatus = useCallback((id: string, status: DispatchStatus) => {
    setDispatches((prev) => prev.map((d) => d.id === id ? { ...d, status } : d));
  }, []);

  const getDispatch = useCallback((id: string) => dispatches.find((d) => d.id === id), [dispatches]);

  const removeNewDispatch = useCallback((requisitionId: string) => {
    setNewDispatches((prev) => prev.filter((d) => d.requisitionId !== requisitionId));
  }, []);

  return (
    <DispatchStoreContext.Provider value={{ newDispatches, partialDispatches, dispatches, addDispatch, deleteDispatch, updateDispatchStatus, getDispatch, removeNewDispatch }}>
      {children}
    </DispatchStoreContext.Provider>
  );
}

export function useDispatchStore() {
  const ctx = useContext(DispatchStoreContext);
  if (!ctx) throw new Error("useDispatchStore must be used within DispatchStoreProvider");
  return ctx;
}
