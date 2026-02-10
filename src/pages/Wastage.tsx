import { BlankModulePage } from "@/components/BlankModulePage";
import { Trash2, FileSpreadsheet } from "lucide-react";

export default function Wastage() {
  return (
    <BlankModulePage
      title="Wastage"
      description="Log and track food wastage"
      icon={Trash2}
      sections={[
        { title: "Wastage Log", description: "View and manage recorded wastage entries.", icon: FileSpreadsheet },
      ]}
    />
  );
}
