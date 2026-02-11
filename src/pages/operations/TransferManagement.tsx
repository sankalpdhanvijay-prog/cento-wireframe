import { BlankModulePage } from "@/components/BlankModulePage";
import { ArrowLeftRight, PackageCheck, History } from "lucide-react";

export default function TransferManagement() {
  return (
    <BlankModulePage
      title="Transfer Management"
      description="Manage inter-outlet stock transfers"
      icon={ArrowLeftRight}
      sections={[
        { title: "Pending Transfers", description: "Review and approve incoming or outgoing transfers.", icon: PackageCheck },
        { title: "Transfer History", description: "Browse completed and past transfers.", icon: History },
      ]}
    />
  );
}
