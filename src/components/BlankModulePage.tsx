import { type LucideIcon } from "lucide-react";

interface EmptySection {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

interface BlankModulePageProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  sections?: EmptySection[];
}

export function BlankModulePage({
  title,
  description,
  icon: Icon,
  sections = [{ title: "Overview" }, { title: "Recent Activity" }],
}: BlankModulePageProps) {
  return (
    <div className="space-y-5 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-9 w-9 rounded-xl bg-cento-yellow-tint-strong flex items-center justify-center">
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

      {/* Content Sections */}
      <div className="grid gap-4">
        {sections.map((section) => {
          const SectionIcon = section.icon || Icon;
          return (
            <div key={section.title} className="cento-card">
              <h3 className="cento-section-header mb-5">{section.title}</h3>
              <div className="cento-empty-state">
                {SectionIcon && (
                  <div className="h-10 w-10 rounded-xl bg-cento-yellow-tint flex items-center justify-center mb-3">
                    <SectionIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                )}
                <p className="text-sm font-medium text-foreground">
                  {section.description || `${section.title}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {section.description
                    ? "This section will be available soon."
                    : `Manage and view your ${section.title.toLowerCase()} here.`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
