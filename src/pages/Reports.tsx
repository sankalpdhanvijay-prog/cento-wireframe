import { BlankModulePage } from "@/components/BlankModulePage";
import { BarChart3, FileText, PieChart } from "lucide-react";

export default function Reports() {
  return (
    <BlankModulePage
      title="Reports"
      description="Analytics and performance reports"
      icon={BarChart3}
      sections={[
        { title: "Report Templates", description: "Choose from pre-built report templates.", icon: FileText },
        { title: "Generated Reports", description: "Access previously generated reports.", icon: PieChart },
      ]}
    />
  );
}
