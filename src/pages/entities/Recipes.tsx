import { BlankModulePage } from "@/components/BlankModulePage";
import { ChefHat, List } from "lucide-react";

export default function Recipes() {
  return (
    <BlankModulePage
      title="Recipes"
      description="Manage recipes and BOMs"
      icon={ChefHat}
      sections={[
        { title: "Recipes List", description: "Browse and manage all registered recipes.", icon: List },
      ]}
    />
  );
}
