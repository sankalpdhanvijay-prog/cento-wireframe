import { BlankModulePage } from "@/components/BlankModulePage";
import { FileInput } from "lucide-react";

export default function NewReceiving() {
  return (
    <BlankModulePage
      title="New Receiving"
      description="Log incoming deliveries"
      icon={FileInput}
      ctaLabel="Log Receiving"
      sections={[
        { title: "Receiving Details", placeholder: "PO reference, supplier, date" },
        { title: "Items Received", placeholder: "Verify items and quantities" },
      ]}
    />
  );
}
