import { useState } from "react";
import { useLocation } from "react-router-dom";
import { settingsSubModules } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { Settings as SettingsIcon } from "lucide-react";

interface SettingsContentProps {
  title: string;
}

function SettingsContent({ title }: SettingsContentProps) {
  return (
    <div className="space-y-5">
      <h2 className="cento-page-title">{title}</h2>
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Configuration</h3>
        <div className="cento-empty-state">
          <div className="h-10 w-10 rounded-xl bg-cento-yellow-tint flex items-center justify-center mb-3">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-1">Configure your {title.toLowerCase()} settings here.</p>
        </div>
      </div>
      <div className="cento-card">
        <h3 className="cento-section-header mb-5">Preferences</h3>
        <div className="cento-empty-state">
          <div className="h-10 w-10 rounded-xl bg-cento-yellow-tint flex items-center justify-center mb-3">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-foreground">Additional preferences</p>
          <p className="text-xs text-muted-foreground mt-1">Fine-tune options and advanced settings.</p>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const location = useLocation();
  const sectionFromState = (location.state as { section?: string } | null)?.section;
  const [activeSection, setActiveSection] = useState(sectionFromState || settingsSubModules[0].path);

  const activeSub = settingsSubModules.find((s) => s.path === activeSection);

  return (
    <div className="flex h-full -m-6">
      {/* Settings secondary nav */}
      <div className="w-60 border-r border-border bg-card overflow-y-auto py-4 shrink-0">
        <div className="px-4 pb-3">
          <span className="cento-section-header">
            Settings
          </span>
        </div>
        {settingsSubModules.map((sub) => (
          <button
            key={sub.path}
            onClick={() => setActiveSection(sub.path)}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm transition-all cursor-pointer relative",
              "hover:bg-cento-yellow-tint",
              activeSection === sub.path
                ? "text-foreground font-medium bg-cento-yellow-tint"
                : "text-muted-foreground"
            )}
          >
            {activeSection === sub.path && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cento-yellow rounded-l-full" />
            )}
            {sub.title}
          </button>
        ))}
      </div>

      {/* Settings content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeSub && <SettingsContent title={activeSub.title} />}
      </div>
    </div>
  );
}
