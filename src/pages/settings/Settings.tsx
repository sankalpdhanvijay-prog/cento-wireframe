import { useState } from "react";
import { settingsSubModules } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SettingsContentProps {
  title: string;
}

function SettingsContent({ title }: SettingsContentProps) {
  return (
    <div className="space-y-5">
      <h2 className="cento-page-title">{title}</h2>
      <div className="cento-card">
        <h3 className="cento-section-header mb-4">Configuration</h3>
        <div className="cento-placeholder">
          {title} settings will be configured here
        </div>
      </div>
      <div className="cento-card">
        <h3 className="cento-section-header mb-4">Preferences</h3>
        <div className="cento-placeholder">
          Additional preferences and options
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState(settingsSubModules[0].path);

  const activeSub = settingsSubModules.find((s) => s.path === activeSection);

  return (
    <div className="flex h-full -m-6">
      {/* Settings secondary nav */}
      <div className="w-60 border-r border-border bg-card overflow-y-auto py-4 shrink-0">
        <div className="px-4 pb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Settings
          </span>
        </div>
        {settingsSubModules.map((sub) => (
          <button
            key={sub.path}
            onClick={() => setActiveSection(sub.path)}
            className={cn(
              "w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer",
              "hover:bg-muted",
              activeSection === sub.path
                ? "text-foreground font-medium border-r-2 border-cento-yellow bg-cento-yellow-light"
                : "text-muted-foreground"
            )}
          >
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
