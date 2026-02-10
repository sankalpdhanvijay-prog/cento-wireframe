import { BlankModulePage } from "@/components/BlankModulePage";
import { Users, List } from "lucide-react";

export default function Vendors() {
  return (
    <BlankModulePage
      title="Vendors"
      description="Manage vendor profiles and contacts"
      icon={Users}
      sections={[
        { title: "Vendors List", description: "Browse and manage all registered vendors.", icon: List },
      ]}
    />
  );
}
