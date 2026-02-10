import { Button } from "@/components/ui/button";
import { type LucideIcon } from "lucide-react";

interface BlankModulePageProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaOnClick?: () => void;
  icon?: LucideIcon;
  sections?: { title: string; placeholder?: string }[];
}

export function BlankModulePage({
  title,
  description,
  ctaLabel,
  ctaOnClick,
  icon: Icon,
  sections = [{ title: "Overview" }, { title: "Recent Activity" }],
}: BlankModulePageProps) {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-lg bg-cento-yellow-light flex items-center justify-center">
              <Icon className="h-5 w-5 text-cento-yellow" strokeWidth={1.5} />
            </div>
          )}
          <div>
            <h2 className="cento-page-title">{title}</h2>
            {description && (
              <p className="cento-helper mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {ctaLabel && (
          <Button variant="cento" onClick={ctaOnClick}>
            {ctaLabel}
          </Button>
        )}
      </div>

      {/* Content Sections */}
      <div className="grid gap-5">
        {sections.map((section) => (
          <div key={section.title} className="cento-card">
            <h3 className="cento-section-header mb-4">{section.title}</h3>
            <div className="cento-placeholder">
              {section.placeholder || `${section.title} content will appear here`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
