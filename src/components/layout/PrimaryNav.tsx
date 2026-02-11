import { useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mainModules, settingsModule, type NavModule } from "@/config/navigation";
import { cn } from "@/lib/utils";

interface PrimaryNavProps {
  lockedModule: NavModule | null;
  onLockModule: (mod: NavModule | null) => void;
  hoveredModule: NavModule | null;
  onHoverModule: (mod: NavModule | null) => void;
}

export function PrimaryNav({ lockedModule, onLockModule, hoveredModule, onHoverModule }: PrimaryNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleMouseEnter = useCallback((mod: NavModule) => {
    // When a module is LOCKED, disable hover entirely
    if (lockedModule) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    if (mod.subModules && mod.subModules.length > 0) {
      onHoverModule(mod);
    } else {
      onHoverModule(null);
    }
  }, [lockedModule, onHoverModule]);

  const handleMouseLeave = useCallback(() => {
    // When LOCKED, don't clear hover
    if (lockedModule) return;
    leaveTimeoutRef.current = setTimeout(() => {
      onHoverModule(null);
    }, 200);
  }, [lockedModule, onHoverModule]);

  const handleNavClick = (mod: NavModule) => {
    if (mod.subModules && mod.subModules.length > 0) {
      if (lockedModule?.path === mod.path) {
        onLockModule(null); // toggle off
      } else {
        onLockModule(mod);
      }
    } else {
      onLockModule(null);
      navigate(mod.path);
    }
  };

  const activePanel = lockedModule || hoveredModule;

  return (
    <nav
      className="w-[var(--nav-width)] bg-card border-r border-border flex flex-col h-full shrink-0"
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo */}
      <div className="h-[var(--header-height)] flex items-center px-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-cento-yellow rounded-full flex items-center justify-center">
            <span className="text-cento-dark font-bold text-sm">C</span>
          </div>
          <span className="font-semibold text-foreground text-base">Cento</span>
        </div>
      </div>

      {/* Main modules */}
      <div className="flex-1 py-1.5 px-2 space-y-0 overflow-y-auto">
        {mainModules.map((mod) => {
          const Icon = mod.icon;
          const active = isActive(mod.path);
          const isPanelTarget = activePanel?.path === mod.path;
          return (
            <button
              key={mod.path}
              onClick={() => handleNavClick(mod)}
              onMouseEnter={() => handleMouseEnter(mod)}
              className={cn(
                "w-full flex items-center gap-2 px-3 h-[42px] rounded-lg text-[13px] transition-colors cursor-pointer relative",
                "hover:bg-cento-yellow-tint",
                active || isPanelTarget
                  ? "text-foreground font-medium bg-cento-yellow-tint"
                  : "text-muted-foreground"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cento-yellow rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  active ? "text-cento-yellow" : ""
                )}
                strokeWidth={active ? 2 : 1.5}
              />
              <span>{mod.title}</span>
              {mod.subModules && (
                <svg
                  className="ml-auto h-3 w-3 text-muted-foreground/50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Settings at bottom */}
      <div className="border-t border-border px-2 py-4 mt-auto">
        <button
          onClick={() => {
            onLockModule(null);
            navigate(settingsModule.path);
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 h-[42px] rounded-lg text-[13px] transition-colors cursor-pointer relative",
            "hover:bg-cento-yellow-tint",
            isActive(settingsModule.path)
              ? "text-foreground font-medium bg-cento-yellow-tint"
              : "text-muted-foreground"
          )}
        >
          {isActive(settingsModule.path) && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-cento-yellow rounded-r-full" />
          )}
          <settingsModule.icon
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              isActive(settingsModule.path) ? "text-cento-yellow" : ""
            )}
            strokeWidth={isActive(settingsModule.path) ? 2 : 1.5}
          />
          <span>{settingsModule.title}</span>
        </button>
      </div>
    </nav>
  );
}
