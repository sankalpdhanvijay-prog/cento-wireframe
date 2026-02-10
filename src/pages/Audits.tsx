import { BlankModulePage } from "@/components/BlankModulePage";
import { ClipboardCheck, History } from "lucide-react";

export default function Audits() {
  return (
    <BlankModulePage
      title="Audits"
      description="Inventory audit logging and review"
      icon={ClipboardCheck}
      sections={[
        { title: "Audit History", description: "View past audits and their results.", icon: History },
      ]}
    />
  );
}
