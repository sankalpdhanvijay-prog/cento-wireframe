import React, { createContext, useContext, useState, useCallback } from "react";
import { format } from "date-fns";

export type TransferStatus = "Drafted" | "Raised" | "Approved" | "Cancelled";

export interface TransferLineItem {
  name: string;
  orderedQty: number;
  transferPrice: number;
  lineTotal: number;
}

export interface TransferOrder {
  id: string;
  buyerOutlet: string;
  senderOutlet: string;
  totalValue: number;
  totalQty: number;
  createdBy: string;
  createdOn: string;
  approvedOn?: string;
  lastUpdated?: string;
  cancelledDate?: string;
  cancelledBy?: string;
  status: TransferStatus;
  expectedDelivery?: string;
  remarks?: string;
  materials: TransferLineItem[];
  subtotal: number;
  otherCharges?: number;
  grandTotal: number;
}

const SEED_TRANSFERS: TransferOrder[] = [
  {
    id: "TO-2001", buyerOutlet: "Main Kitchen", senderOutlet: "Central Warehouse", totalValue: 14500, totalQty: 80,
    createdBy: "Ankit", createdOn: "2026-02-10", lastUpdated: "2026-02-11", status: "Drafted",
    expectedDelivery: "2026-02-15",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 40, transferPrice: 200, lineTotal: 8000 },
      { name: "Sunflower Oil 15L", orderedQty: 20, transferPrice: 325, lineTotal: 6500 },
    ],
    subtotal: 14500, grandTotal: 14500,
  },
  {
    id: "TO-2002", buyerOutlet: "Branch - Indiranagar", senderOutlet: "Main Kitchen", totalValue: 8200, totalQty: 50,
    createdBy: "Meera", createdOn: "2026-02-08", lastUpdated: "2026-02-09", status: "Drafted",
    materials: [
      { name: "Chicken Breast", orderedQty: 30, transferPrice: 180, lineTotal: 5400 },
      { name: "Onion (Red)", orderedQty: 20, transferPrice: 140, lineTotal: 2800 },
    ],
    subtotal: 8200, grandTotal: 8200,
  },
  {
    id: "TO-2003", buyerOutlet: "Branch - Koramangala", senderOutlet: "Central Warehouse", totalValue: 22000, totalQty: 120,
    createdBy: "Raj", createdOn: "2026-02-05", status: "Raised", expectedDelivery: "2026-02-12",
    materials: [
      { name: "All-Purpose Flour 50kg", orderedQty: 60, transferPrice: 200, lineTotal: 12000 },
      { name: "Mozzarella Cheese", orderedQty: 30, transferPrice: 200, lineTotal: 6000 },
      { name: "Olive Oil (Extra Virgin)", orderedQty: 30, transferPrice: 133, lineTotal: 4000 },
    ],
    subtotal: 22000, grandTotal: 22000,
  },
  {
    id: "TO-2004", buyerOutlet: "Main Kitchen", senderOutlet: "Branch - Koramangala", totalValue: 5600, totalQty: 35,
    createdBy: "Ankit", createdOn: "2026-02-01", status: "Raised",
    materials: [
      { name: "Garlic", orderedQty: 15, transferPrice: 100, lineTotal: 1500 },
      { name: "Ginger", orderedQty: 20, transferPrice: 205, lineTotal: 4100 },
    ],
    subtotal: 5600, grandTotal: 5600,
  },
  {
    id: "TO-2005", buyerOutlet: "Central Warehouse", senderOutlet: "Main Kitchen", totalValue: 18000, totalQty: 100,
    createdBy: "Meera", createdOn: "2026-01-28", status: "Approved", expectedDelivery: "2026-02-05",
    approvedOn: "2026-01-30",
    materials: [
      { name: "Basmati Rice 25kg", orderedQty: 50, transferPrice: 200, lineTotal: 10000 },
      { name: "Cumin Powder", orderedQty: 50, transferPrice: 160, lineTotal: 8000 },
    ],
    subtotal: 18000, grandTotal: 18000,
  },
  {
    id: "TO-2006", buyerOutlet: "Branch - Indiranagar", senderOutlet: "Central Warehouse", totalValue: 6500, totalQty: 40,
    createdBy: "Raj", createdOn: "2026-01-20", status: "Cancelled",
    cancelledDate: "2026-01-22", cancelledBy: "Ankit",
    materials: [
      { name: "Tomato Paste 5kg", orderedQty: 40, transferPrice: 162.5, lineTotal: 6500 },
    ],
    subtotal: 6500, grandTotal: 6500,
  },
];

interface TransferStoreContextType {
  transfers: TransferOrder[];
  addTransfer: (order: Omit<TransferOrder, "id">) => string;
  deleteTransfer: (id: string) => void;
  updateTransferStatus: (id: string, status: TransferStatus) => void;
  getTransfer: (id: string) => TransferOrder | undefined;
}

const TransferStoreContext = createContext<TransferStoreContextType | null>(null);

let nextId = 2007;

export function TransferStoreProvider({ children }: { children: React.ReactNode }) {
  const [transfers, setTransfers] = useState<TransferOrder[]>(SEED_TRANSFERS);

  const addTransfer = useCallback((order: Omit<TransferOrder, "id">) => {
    const id = `TO-${nextId++}`;
    setTransfers((prev) => [{ ...order, id } as TransferOrder, ...prev]);
    return id;
  }, []);

  const deleteTransfer = useCallback((id: string) => {
    setTransfers((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const updateTransferStatus = useCallback((id: string, status: TransferStatus) => {
    setTransfers((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const now = format(new Date(), "yyyy-MM-dd");
        const updates: Partial<TransferOrder> = { status, lastUpdated: now };
        if (status === "Approved") updates.approvedOn = now;
        if (status === "Cancelled") { updates.cancelledDate = now; updates.cancelledBy = "Admin"; }
        return { ...o, ...updates };
      })
    );
  }, []);

  const getTransfer = useCallback((id: string) => transfers.find((o) => o.id === id), [transfers]);

  return (
    <TransferStoreContext.Provider value={{ transfers, addTransfer, deleteTransfer, updateTransferStatus, getTransfer }}>
      {children}
    </TransferStoreContext.Provider>
  );
}

export function useTransferStore() {
  const ctx = useContext(TransferStoreContext);
  if (!ctx) throw new Error("useTransferStore must be used within TransferStoreProvider");
  return ctx;
}
