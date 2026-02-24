import React, { createContext, useContext, useState, useCallback } from "react";
import { format } from "date-fns";

export interface RecipeItem {
  materialId: string;
  materialName: string;
  category: string;
  unit: string;
  quantity: number;
}

export interface ProductionPlanItem {
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  productionQty: number;
  batchName: string;
  expiryDate: string;
  recipeItems: RecipeItem[];
}

export interface StockRequirementItem {
  materialCode: string;
  materialName: string;
  category: string;
  unit: string;
  costPerUnit: number;
  stockUsage: number;
  usageCost: number;
}

export interface Production {
  id: string;
  productionPlan: string;
  productionDate: string;
  producedBy: string;
  totalProduced: number;
  deleted: boolean;
  planItems: ProductionPlanItem[];
  stockRequirements: StockRequirementItem[];
}

const SEED_PRODUCTIONS: Production[] = [
  {
    id: "PRD-4001", productionPlan: "Morning Bread Batch", productionDate: "2026-02-20", producedBy: "Raj",
    totalProduced: 150, deleted: false,
    planItems: [
      {
        materialCode: "FG-001", materialName: "White Bread Loaf", category: "Bakery", unit: "PCS",
        productionQty: 100, batchName: "Batch-A1", expiryDate: "2026-02-23",
        recipeItems: [
          { materialId: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", quantity: 25 },
          { materialId: "RM-002", materialName: "Olive Oil (Extra Virgin)", category: "Oils", unit: "LTR", quantity: 2 },
        ],
      },
      {
        materialCode: "FG-002", materialName: "Garlic Bread", category: "Bakery", unit: "PCS",
        productionQty: 50, batchName: "Batch-A2", expiryDate: "2026-02-22",
        recipeItems: [
          { materialId: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", quantity: 12 },
          { materialId: "RM-009", materialName: "Garlic", category: "Vegetables", unit: "KG", quantity: 3 },
          { materialId: "RM-002", materialName: "Olive Oil (Extra Virgin)", category: "Oils", unit: "LTR", quantity: 1 },
        ],
      },
    ],
    stockRequirements: [
      { materialCode: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", costPerUnit: 42, stockUsage: 37, usageCost: 1554 },
      { materialCode: "RM-002", materialName: "Olive Oil (Extra Virgin)", category: "Oils", unit: "LTR", costPerUnit: 620, stockUsage: 3, usageCost: 1860 },
      { materialCode: "RM-009", materialName: "Garlic", category: "Vegetables", unit: "KG", costPerUnit: 120, stockUsage: 3, usageCost: 360 },
    ],
  },
  {
    id: "PRD-4002", productionPlan: "Lunch Prep", productionDate: "2026-02-19", producedBy: "Meera",
    totalProduced: 200, deleted: false,
    planItems: [
      {
        materialCode: "FG-003", materialName: "Paneer Tikka", category: "Ready-to-Cook", unit: "KG",
        productionQty: 80, batchName: "Batch-B1", expiryDate: "2026-02-21",
        recipeItems: [
          { materialId: "RM-007", materialName: "Mozzarella Cheese", category: "Dairy", unit: "KG", quantity: 10 },
          { materialId: "RM-006", materialName: "Cumin Powder", category: "Spices", unit: "KG", quantity: 1 },
        ],
      },
      {
        materialCode: "FG-004", materialName: "Biryani Rice Mix", category: "Ready-to-Cook", unit: "KG",
        productionQty: 120, batchName: "Batch-B2", expiryDate: "2026-02-21",
        recipeItems: [
          { materialId: "RM-001", materialName: "Basmati Rice", category: "Grains", unit: "KG", quantity: 30 },
          { materialId: "RM-004", materialName: "Onion (Red)", category: "Vegetables", unit: "KG", quantity: 10 },
          { materialId: "RM-006", materialName: "Cumin Powder", category: "Spices", unit: "KG", quantity: 2 },
        ],
      },
    ],
    stockRequirements: [
      { materialCode: "RM-007", materialName: "Mozzarella Cheese", category: "Dairy", unit: "KG", costPerUnit: 520, stockUsage: 10, usageCost: 5200 },
      { materialCode: "RM-006", materialName: "Cumin Powder", category: "Spices", unit: "KG", costPerUnit: 450, stockUsage: 3, usageCost: 1350 },
      { materialCode: "RM-001", materialName: "Basmati Rice", category: "Grains", unit: "KG", costPerUnit: 85, stockUsage: 30, usageCost: 2550 },
      { materialCode: "RM-004", materialName: "Onion (Red)", category: "Vegetables", unit: "KG", costPerUnit: 35, stockUsage: 10, usageCost: 350 },
    ],
  },
  {
    id: "PRD-4003", productionPlan: "Evening Snack Batch", productionDate: "2026-02-18", producedBy: "Ankit",
    totalProduced: 75, deleted: true,
    planItems: [
      {
        materialCode: "FG-005", materialName: "Samosa", category: "Snacks", unit: "PCS",
        productionQty: 75, batchName: "Batch-C1", expiryDate: "2026-02-19",
        recipeItems: [
          { materialId: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", quantity: 5 },
          { materialId: "RM-004", materialName: "Onion (Red)", category: "Vegetables", unit: "KG", quantity: 3 },
        ],
      },
    ],
    stockRequirements: [
      { materialCode: "RM-008", materialName: "All-Purpose Flour", category: "Grains", unit: "KG", costPerUnit: 42, stockUsage: 5, usageCost: 210 },
      { materialCode: "RM-004", materialName: "Onion (Red)", category: "Vegetables", unit: "KG", costPerUnit: 35, stockUsage: 3, usageCost: 105 },
    ],
  },
];

interface ProductionStoreContextType {
  productions: Production[];
  addProduction: (prod: Omit<Production, "id">) => string;
  deleteProduction: (id: string) => void;
  getProduction: (id: string) => Production | undefined;
}

const ProductionStoreContext = createContext<ProductionStoreContextType | null>(null);

let nextPrdId = 4004;

export function ProductionStoreProvider({ children }: { children: React.ReactNode }) {
  const [productions, setProductions] = useState<Production[]>(SEED_PRODUCTIONS);

  const addProduction = useCallback((prod: Omit<Production, "id">) => {
    const id = `PRD-${nextPrdId++}`;
    setProductions((prev) => [{ ...prod, id } as Production, ...prev]);
    return id;
  }, []);

  const deleteProduction = useCallback((id: string) => {
    setProductions((prev) => prev.map((p) => p.id === id ? { ...p, deleted: true } : p));
  }, []);

  const getProduction = useCallback((id: string) => productions.find((p) => p.id === id), [productions]);

  return (
    <ProductionStoreContext.Provider value={{ productions, addProduction, deleteProduction, getProduction }}>
      {children}
    </ProductionStoreContext.Provider>
  );
}

export function useProductionStore() {
  const ctx = useContext(ProductionStoreContext);
  if (!ctx) throw new Error("useProductionStore must be used within ProductionStoreProvider");
  return ctx;
}
