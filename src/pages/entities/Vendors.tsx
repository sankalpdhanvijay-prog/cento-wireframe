import { BlankModulePage } from "@/components/BlankModulePage";
import { Users } from "lucide-react";

export default function Vendors() {
  return (
    <BlankModulePage
      title="Vendors"
      description="Manage vendor profiles and contacts"
      icon={Users}
      ctaLabel="Add Vendor"
      sections={[
        { title: "Vendors List", placeholder: "All registered vendors" },
      ]}
    />
  );
}
