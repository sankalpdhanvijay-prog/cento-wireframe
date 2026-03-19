import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Truck,
  
  Building2,
  ClipboardCheck,
  Trash2,
  Settings,
  FilePlus,
  FileInput,
  ListOrdered,
  SendHorizonal,
  Factory,
  ArrowLeftRight,
  Apple,
  ChefHat,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SubModule {
  title: string;
  path: string;
  icon: LucideIcon;
}

export interface NavModule {
  title: string;
  path: string;
  icon: LucideIcon;
  subModules?: SubModule[];
  ctaLabel?: string;
  standout?: boolean;
}

export const mainModules: NavModule[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Reports",
    path: "/reports",
    icon: BarChart3,
  },
  {
    title: "Procurements",
    path: "/procurements",
    icon: ShoppingCart,
    subModules: [
      { title: "Purchases", path: "/procurements/purchases", icon: FilePlus },
      { title: "Receivings", path: "/procurements/receivings", icon: FileInput },
      { title: "Closed Orders", path: "/procurements/closed-orders", icon: ListOrdered },
    ],
  },
  {
    title: "Operations",
    path: "/operations",
    icon: Truck,
    subModules: [
      { title: "Dispatches", path: "/operations/dispatches", icon: SendHorizonal },
      { title: "Productions", path: "/operations/productions", icon: Factory },
      { title: "Transfers", path: "/operations/transfers", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Entities",
    path: "/entities",
    icon: Building2,
    subModules: [
      { title: "Materials", path: "/entities/materials", icon: Apple },
      { title: "Recipes", path: "/entities/recipes", icon: ChefHat },
      { title: "Vendors", path: "/entities/vendors", icon: Users },
    ],
  },
  {
    title: "Audits",
    path: "/audits",
    icon: ClipboardCheck,
    ctaLabel: "Log Audit",
  },
  {
    title: "Wastage",
    path: "/wastage",
    icon: Trash2,
    ctaLabel: "Upload Excel",
  },
];

export const settingsModule: NavModule = {
  title: "Settings",
  path: "/settings",
  icon: Settings,
};

export const settingsSubModules = [
  { title: "Outlet Management", path: "/settings/outlets" },
  { title: "User Management", path: "/settings/user-management" },
  { title: "Material Management", path: "/settings/material-management" },
  { title: "Vendor Management", path: "/settings/vendor-management" },
  { title: "Orders Management", path: "/settings/orders-management" },
  { title: "Recipe Management", path: "/settings/recipe-management" },
  { title: "Unit Management", path: "/settings/units" },
  { title: "Tax Management", path: "/settings/tax" },
  { title: "Audit & Wastage Management", path: "/settings/audit-wastage" },
  { title: "User Roles & Permissions", path: "/settings/roles" },
];
