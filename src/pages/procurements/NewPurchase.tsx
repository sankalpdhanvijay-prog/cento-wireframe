import { BlankModulePage } from "@/components/BlankModulePage";
import { FilePlus, ClipboardList, List } from "lucide-react";

export default function NewPurchase() {
  return (
    <BlankModulePage
      title="New Purchase Order"
      description="Create a new purchase order"
      icon={FilePlus}
      sections={[
        { title: "Order Details", description: "Set vendor, date, and delivery information.", icon: ClipboardList },
        { title: "Line Items", description: "Add materials and quantities to this order.", icon: List },
      ]}
    />
  );
}
