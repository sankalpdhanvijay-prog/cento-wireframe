import { BlankModulePage } from "@/components/BlankModulePage";
import { Apple } from "lucide-react";

export default function Materials() {
  return (
    <BlankModulePage
      title="Materials"
      description="Manage raw materials and ingredients"
      icon={Apple}
      ctaLabel="Add Material"
      sections={[
        { title: "Materials List", placeholder: "All registered materials" },
      ]}
    />
  );
}
