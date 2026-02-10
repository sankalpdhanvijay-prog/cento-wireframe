import { BlankModulePage } from "@/components/BlankModulePage";
import { Trash2 } from "lucide-react";

export default function Wastage() {
  return (
    <BlankModulePage
      title="Wastage"
      description="Log and track food wastage"
      icon={Trash2}
      ctaLabel="Upload Excel"
      sections={[
        { title: "Wastage Log", placeholder: "Recorded wastage entries" },
      ]}
    />
  );
}
