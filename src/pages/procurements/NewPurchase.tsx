import { BlankModulePage } from "@/components/BlankModulePage";
import { FilePlus } from "lucide-react";

export default function NewPurchase() {
  return (
    <BlankModulePage
      title="New Purchase Order"
      description="Create a new purchase order"
      icon={FilePlus}
      ctaLabel="Create PO"
      sections={[
        { title: "Order Details", placeholder: "Vendor, date, and delivery info" },
        { title: "Line Items", placeholder: "Add materials and quantities" },
      ]}
    />
  );
}
