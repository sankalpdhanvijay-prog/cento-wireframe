import { BlankModulePage } from "@/components/BlankModulePage";
import { ListOrdered } from "lucide-react";

export default function AllOrders() {
  return (
    <BlankModulePage
      title="All Orders"
      description="Consolidated purchase order lifecycle"
      icon={ListOrdered}
      sections={[
        { title: "Filters & Search", placeholder: "Filter by status, vendor, date" },
        { title: "Orders List", placeholder: "Purchase orders table" },
      ]}
    />
  );
}
