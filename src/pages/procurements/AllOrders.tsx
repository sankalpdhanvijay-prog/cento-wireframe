import { BlankModulePage } from "@/components/BlankModulePage";
import { ListOrdered, Search, Table } from "lucide-react";

export default function AllOrders() {
  return (
    <BlankModulePage
      title="All Orders"
      description="Consolidated purchase order lifecycle"
      icon={ListOrdered}
      sections={[
        { title: "Filters & Search", description: "Filter orders by status, vendor, or date.", icon: Search },
        { title: "Orders List", description: "Browse and manage all purchase orders.", icon: Table },
      ]}
    />
  );
}
