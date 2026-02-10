import { useLocation } from "react-router-dom";
import { mainModules, settingsModule, type NavModule } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const getDomainInfo = (pathname: string) => {
  const allModules = [...mainModules, settingsModule];
  const matched = allModules.find(
    (m) => pathname === m.path || pathname.startsWith(m.path + "/")
  );
  if (!matched) return { title: "Dashboard", breadcrumb: "", icon: null, ctaLabel: "" };

  const sub = matched.subModules?.find(
    (s) => pathname === s.path || pathname.startsWith(s.path + "/")
  );

  // Determine CTA: sub-module pages may have their own, otherwise use domain-level
  let ctaLabel = matched.ctaLabel || "";
  // Common CTAs for sub-module pages
  if (sub) {
    const subCtaMap: Record<string, string> = {
      "/procurements/new-purchase": "Create PO",
      "/procurements/new-receiving": "Log Receiving",
      "/entities/materials": "Add Material",
      "/entities/recipes": "Add Recipe",
      "/entities/vendors": "Add Vendor",
    };
    ctaLabel = subCtaMap[sub.path] || ctaLabel;
  }

  return {
    title: matched.title,
    breadcrumb: sub?.title || "",
    icon: matched.icon,
    ctaLabel,
  };
};

export function DomainHeader() {
  const location = useLocation();
  const { title, breadcrumb, icon: Icon, ctaLabel } = getDomainInfo(location.pathname);

  return (
    <header className="h-[var(--header-height)] border-b border-border bg-cento-yellow-tint flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-cento-yellow-tint-strong flex items-center justify-center">
            <Icon className="h-4 w-4 text-cento-yellow" strokeWidth={2} />
          </div>
        )}
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
        {breadcrumb && (
          <>
            <span className="text-muted-foreground text-xs">›</span>
            <span className="text-xs text-muted-foreground font-medium">{breadcrumb}</span>
          </>
        )}
      </div>
      {ctaLabel && (
        <Button variant="cento" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          {ctaLabel}
        </Button>
      )}
    </header>
  );
}
