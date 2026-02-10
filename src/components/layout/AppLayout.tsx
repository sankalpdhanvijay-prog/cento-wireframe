import { useState, useRef, useCallback, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PrimaryNav } from "./PrimaryNav";
import { SubModulePanel } from "./SubModulePanel";
import { DomainHeader } from "./DomainHeader";
import { type NavModule } from "@/config/navigation";

export function AppLayout() {
  const [lockedModule, setLockedModule] = useState<NavModule | null>(null);
  const [hoveredModule, setHoveredModule] = useState<NavModule | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  const activePanel = lockedModule || hoveredModule;

  // Click outside panel to collapse unlocked hover panel
  const contentRef = useRef<HTMLDivElement>(null);

  // When navigating, clear the locked module if the new route is outside the locked module
  useEffect(() => {
    if (lockedModule && !location.pathname.startsWith(lockedModule.path)) {
      setLockedModule(null);
    }
  }, [location.pathname, lockedModule]);

  const handlePanelMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  }, []);

  const handlePanelMouseLeave = useCallback(() => {
    // Only auto-hide if not locked
    if (!lockedModule) {
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredModule(null);
      }, 150);
    }
  }, [lockedModule]);

  const handleContentClick = useCallback(() => {
    // Clicking main content area collapses unlocked panel
    if (!lockedModule) {
      setHoveredModule(null);
    }
    // If locked, clicking content collapses it
    setLockedModule(null);
  }, [lockedModule]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PrimaryNav
        lockedModule={lockedModule}
        onLockModule={setLockedModule}
        hoveredModule={hoveredModule}
        onHoverModule={setHoveredModule}
      />
      {activePanel && activePanel.subModules && (
        <SubModulePanel
          module={activePanel}
          isLocked={lockedModule?.path === activePanel.path}
          onMouseEnter={handlePanelMouseEnter}
          onMouseLeave={handlePanelMouseLeave}
        />
      )}
      <div
        ref={contentRef}
        className="flex flex-col flex-1 min-w-0"
        onClick={handleContentClick}
      >
        <DomainHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
