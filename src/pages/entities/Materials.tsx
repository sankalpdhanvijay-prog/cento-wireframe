import { BlankModulePage } from "@/components/BlankModulePage";
import { Apple, List } from "lucide-react";

export default function Materials() {
  return (
    <BlankModulePage
      title="Materials"
      description="Manage raw materials and ingredients"
      icon={Apple}
      sections={[
        { title: "Materials List", description: "Browse and manage all registered materials.", icon: List },
      ]}
    />
  );
}
