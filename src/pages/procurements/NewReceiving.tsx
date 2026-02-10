import { BlankModulePage } from "@/components/BlankModulePage";
import { FileInput, ClipboardList, PackageCheck } from "lucide-react";

export default function NewReceiving() {
  return (
    <BlankModulePage
      title="New Receiving"
      description="Log incoming deliveries"
      icon={FileInput}
      sections={[
        { title: "Receiving Details", description: "Reference PO, supplier, and delivery date.", icon: ClipboardList },
        { title: "Items Received", description: "Verify delivered items and quantities.", icon: PackageCheck },
      ]}
    />
  );
}
