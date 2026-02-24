import { useLocation } from "react-router-dom";
import { mainModules, settingsModule, type NavModule } from "@/config/navigation";

const getDomainInfo = (pathname: string) => {
  const allModules = [...mainModules, settingsModule];
  const matched = allModules.find(
    (m) => pathname === m.path || pathname.startsWith(m.path + "/")
  );
  if (!matched) return { title: "Dashboard", breadcrumb: "", icon: null };

  const sub = matched.subModules?.find(
    (s) => pathname === s.path || pathname.startsWith(s.path + "/")
  );

  return {
    title: matched.title,
    breadcrumb: sub?.title || "",
    icon: matched.icon,
  };
};

export function DomainHeader() {
  const location = useLocation();
  const { title, breadcrumb, icon: Icon } = getDomainInfo(location.pathname);

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
    </header>
  );
}
