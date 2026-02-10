import { BlankModulePage } from "@/components/BlankModulePage";
import { LayoutDashboard } from "lucide-react";

export default function Dashboard() {
  return (
    <BlankModulePage
      title="Dashboard"
      description="Overview of your restaurant operations"
      icon={LayoutDashboard}
      sections={[
        { title: "Key Metrics", placeholder: "KPI cards will appear here" },
        { title: "Recent Orders", placeholder: "Recent purchase orders" },
        { title: "Stock Alerts", placeholder: "Low-stock and expiry alerts" },
      ]}
    />
  );
}
