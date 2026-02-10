import { BlankModulePage } from "@/components/BlankModulePage";
import { Factory, CalendarDays, ClipboardList } from "lucide-react";

export default function ProductionManagement() {
  return (
    <BlankModulePage
      title="Production Management"
      description="Plan and log production activities"
      icon={Factory}
      sections={[
        { title: "Production Plans", description: "Plan and manage your production batches here.", icon: CalendarDays },
        { title: "Production Log", description: "View completed production entries.", icon: ClipboardList },
      ]}
    />
  );
}
