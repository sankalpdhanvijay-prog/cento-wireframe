import { BlankModulePage } from "@/components/BlankModulePage";
import { Package, Layers, ArrowUpDown, AlertTriangle } from "lucide-react";

export default function Inventory() {
  return (
    <BlankModulePage
      title="Inventory"
      description="Track stock levels and movements"
      icon={Package}
      sections={[
        { title: "Stock Overview", description: "View current stock levels by category.", icon: Layers },
        { title: "Recent Movements", description: "Track stock in and out activity.", icon: ArrowUpDown },
        { title: "Alerts", description: "Low-stock and expiry warnings.", icon: AlertTriangle },
      ]}
    />
  );
}
