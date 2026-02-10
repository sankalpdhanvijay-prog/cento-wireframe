import { BlankModulePage } from "@/components/BlankModulePage";
import { ClipboardCheck } from "lucide-react";

export default function Audits() {
  return (
    <BlankModulePage
      title="Audits"
      description="Inventory audit logging and review"
      icon={ClipboardCheck}
      ctaLabel="Log Audit"
      sections={[
        { title: "Audit History", placeholder: "Past audits and results" },
      ]}
    />
  );
}
