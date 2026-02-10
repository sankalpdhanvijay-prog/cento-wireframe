import { BlankModulePage } from "@/components/BlankModulePage";
import { Factory } from "lucide-react";

export default function ProductionManagement() {
  return (
    <BlankModulePage
      title="Production Management"
      description="Plan and log production activities"
      icon={Factory}
      sections={[
        { title: "Production Plans", placeholder: "Active production schedules" },
        { title: "Production Log", placeholder: "Completed production entries" },
      ]}
    />
  );
}
