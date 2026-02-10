import { BlankModulePage } from "@/components/BlankModulePage";
import { LayoutDashboard, TrendingUp, ShoppingCart, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  return (
    <BlankModulePage
      title="Dashboard"
      description="Overview of your restaurant operations"
      icon={LayoutDashboard}
      sections={[
        { title: "Key Metrics", description: "Track KPIs across procurement, inventory, and operations.", icon: TrendingUp },
        { title: "Recent Orders", description: "View and manage your latest purchase orders.", icon: ShoppingCart },
        { title: "Stock Alerts", description: "Monitor low-stock and expiry warnings in real time.", icon: AlertTriangle },
      ]}
    />
  );
}
