import { BlankModulePage } from "@/components/BlankModulePage";
import { BarChart3 } from "lucide-react";

export default function Reports() {
  return (
    <BlankModulePage
      title="Reports"
      description="Analytics and performance reports"
      icon={BarChart3}
      sections={[
        { title: "Report Templates" },
        { title: "Generated Reports" },
      ]}
    />
  );
}
