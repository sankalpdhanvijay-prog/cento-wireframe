import { BlankModulePage } from "@/components/BlankModulePage";
import { ChefHat } from "lucide-react";

export default function Recipes() {
  return (
    <BlankModulePage
      title="Recipes"
      description="Manage recipes and BOMs"
      icon={ChefHat}
      ctaLabel="Add Recipe"
      sections={[
        { title: "Recipes List", placeholder: "All registered recipes" },
      ]}
    />
  );
}
