import { BlankModulePage } from "@/components/BlankModulePage";
import { Package } from "lucide-react";

export default function Inventory() {
  return (
    <BlankModulePage
      title="Inventory"
      description="Track stock levels and movements"
      icon={Package}
      sections={[
        { title: "Stock Overview", placeholder: "Current stock levels by category" },
        { title: "Recent Movements", placeholder: "Stock in/out activity" },
        { title: "Alerts", placeholder: "Low-stock and expiry warnings" },
      ]}
    />
  );
}
