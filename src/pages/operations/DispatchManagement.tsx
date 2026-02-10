import { BlankModulePage } from "@/components/BlankModulePage";
import { SendHorizonal, Clock, CheckCircle2 } from "lucide-react";

export default function DispatchManagement() {
  return (
    <BlankModulePage
      title="Dispatch Management"
      description="Manage and approve dispatches"
      icon={SendHorizonal}
      sections={[
        { title: "Pending Approvals", description: "Review dispatches awaiting your approval.", icon: Clock },
        { title: "Dispatch History", description: "Browse completed and past dispatches.", icon: CheckCircle2 },
      ]}
    />
  );
}
