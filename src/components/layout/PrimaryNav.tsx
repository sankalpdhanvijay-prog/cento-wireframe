import { useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mainModules, settingsModule, type NavModule, type SubModule } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function PrimaryNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredModule, setHoveredModule] = useState<NavModule | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleMouseEnter = useCallback((mod: NavModule) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (mod.subModules && mod.subModules.length > 0) {
      setHoveredModule(mod);
    } else {
      setHoveredModule(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModule(null);
    }, 150);
  }, []);

  const handlePanelEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handlePanelLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredModule(null);
    }, 100);
  }, []);

  const handleNavClick = (mod: NavModule) => {
    if (!mod.subModules || mod.subModules.length === 0) {
      navigate(mod.path);
    }
  };

  const handleSubClick = (sub: SubModule) => {
    navigate(sub.path);
    setHoveredModule(null);
  };

  return (
    <div className="relative flex shrink-0" onMouseLeave={handleMouseLeave}>
      {/* Primary Nav */}
      <nav className="w-[var(--nav-width)] bg-card border-r border-border flex flex-col h-full">
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
            return (
              <button
                key={mod.path}
                onClick={() => handleNavClick(mod)}
                onMouseEnter={() => handleMouseEnter(mod)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 h-[42px] rounded-lg text-[13px] transition-all cursor-pointer relative",
                  "hover:bg-cento-yellow-tint",
                  active
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
            onClick={() => navigate(settingsModule.path)}
            onMouseEnter={() => handleMouseEnter(settingsModule)}
            className={cn(
              "w-full flex items-center gap-2 px-3 h-[42px] rounded-lg text-[13px] transition-all cursor-pointer relative",
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

      {/* Hover Sub-Module Panel */}
      {hoveredModule && hoveredModule.subModules && (
        <div
          ref={panelRef}
          onMouseEnter={handlePanelEnter}
          onMouseLeave={handlePanelLeave}
          className="absolute left-[var(--nav-width)] top-[var(--header-height)] z-50 w-[272px] bg-card rounded-r-[12px] shadow-lg border border-border border-l-0 py-2 animate-slide-in"
        >
          <div className="px-4 py-2.5">
            <span className="cento-section-header">
              {hoveredModule.title}
            </span>
          </div>
          {hoveredModule.subModules.map((sub) => {
            const SubIcon = sub.icon;
            const subActive = isActive(sub.path);
            return (
              <button
                key={sub.path}
                onClick={() => handleSubClick(sub)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all cursor-pointer relative",
                  "hover:bg-[hsl(45_60%_97%)]",
                  subActive
                    ? "text-foreground font-medium bg-cento-yellow-tint-strong"
                    : "text-muted-foreground"
                )}
              >
                {subActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-cento-yellow rounded-r-full" />
                )}
                <SubIcon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                <span>{sub.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
