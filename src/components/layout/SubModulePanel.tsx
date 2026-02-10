import { useLocation, useNavigate } from "react-router-dom";
import { type NavModule, type SubModule } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface SubModulePanelProps {
  module: NavModule;
  isLocked: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function SubModulePanel({ module, isLocked, onMouseEnter, onMouseLeave }: SubModulePanelProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleSubClick = (sub: SubModule) => {
    navigate(sub.path);
  };

  if (!module.subModules || module.subModules.length === 0) return null;

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="w-[240px] bg-cento-yellow-tint border-r border-border flex flex-col h-full shrink-0 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)] animate-slide-in"
    >
      {/* Header aligned with logo area */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-border">
        <span className="cento-section-header">{module.title}</span>
      </div>

      {/* Sub-module list */}
      <div className="flex-1 py-2 overflow-y-auto">
        {module.subModules.map((sub) => {
          const SubIcon = sub.icon;
          const subActive = isActive(sub.path);
          return (
            <button
              key={sub.path}
              onClick={() => handleSubClick(sub)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-all cursor-pointer relative",
                "hover:bg-cento-yellow-tint-strong",
                subActive
                  ? "text-cento-yellow font-medium bg-cento-yellow-tint-strong"
                  : "text-muted-foreground font-medium"
              )}
            >
              {subActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 bg-cento-yellow rounded-r-full" />
              )}
              <SubIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  subActive ? "text-cento-yellow" : ""
                )}
                strokeWidth={1.5}
              />
              <span>{sub.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
