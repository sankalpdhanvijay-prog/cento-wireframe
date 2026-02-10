import { useState, useRef, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PrimaryNav } from "./PrimaryNav";
import { SubModulePanel } from "./SubModulePanel";
import { DomainHeader } from "./DomainHeader";
import { type NavModule } from "@/config/navigation";

export function AppLayout() {
  const [lockedModule, setLockedModule] = useState<NavModule | null>(null);
  const [hoveredModule, setHoveredModule] = useState<NavModule | null>(null);
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  // The panel to show: locked takes priority, then hovered (if not manually collapsed for locked)
  const activePanel = lockedModule || hoveredModule;

  // When navigating, clear lock if new route is outside the locked module
  useEffect(() => {
    if (lockedModule && !location.pathname.startsWith(lockedModule.path)) {
      setLockedModule(null);
      setManuallyCollapsed(false);
    }
  }, [location.pathname, lockedModule]);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const handlePanelMouseEnter = useCallback(() => {
    clearHoverTimeout();
  }, [clearHoverTimeout]);

  const handlePanelMouseLeave = useCallback(() => {
    // Only auto-hide hover panels, never locked ones
    if (!lockedModule) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredModule(null);
      }, 200);
    }
  }, [lockedModule]);

  const handleLockModule = useCallback((mod: NavModule | null) => {
    setLockedModule(mod);
    setManuallyCollapsed(false);
    if (mod) {
      setHoveredModule(null);
    }
  }, []);

  const handleHoverModule = useCallback((mod: NavModule | null) => {
    clearHoverTimeout();
    setHoveredModule(mod);
  }, [clearHoverTimeout]);

  const handleCollapseToggle = useCallback(() => {
    if (lockedModule) {
      setLockedModule(null);
      setManuallyCollapsed(true);
    }
  }, [lockedModule]);

  // Determine if the sub-module panel should be visible
  const showPanel = activePanel && activePanel.subModules && activePanel.subModules.length > 0
    && !(manuallyCollapsed && !hoveredModule);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PrimaryNav
        lockedModule={lockedModule}
        onLockModule={handleLockModule}
        hoveredModule={hoveredModule}
        onHoverModule={handleHoverModule}
      />
      {showPanel && activePanel && (
        <SubModulePanel
          module={activePanel}
          isLocked={lockedModule?.path === activePanel.path}
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
          onCollapse={handleCollapseToggle}
        />
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <DomainHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
