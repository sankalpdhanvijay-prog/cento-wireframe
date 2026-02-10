import { BlankModulePage } from "@/components/BlankModulePage";
import { SendHorizonal } from "lucide-react";

export default function DispatchManagement() {
  return (
    <BlankModulePage
      title="Dispatch Management"
      description="Manage and approve dispatches"
      icon={SendHorizonal}
      sections={[
        { title: "Pending Approvals", placeholder: "Dispatches awaiting approval" },
        { title: "Dispatch History", placeholder: "Completed dispatches" },
      ]}
    />
  );
}
