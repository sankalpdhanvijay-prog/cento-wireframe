import { useLocation } from "react-router-dom";
import { mainModules, settingsModule } from "@/config/navigation";

const getDomainInfo = (pathname: string) => {
  const allModules = [...mainModules, settingsModule];
  const matched = allModules.find(
    (m) => pathname === m.path || pathname.startsWith(m.path + "/")
  );
  if (!matched) return { title: "Dashboard", breadcrumb: "" };

  const sub = matched.subModules?.find(
    (s) => pathname === s.path || pathname.startsWith(s.path + "/")
  );

  return {
    title: matched.title,
    breadcrumb: sub?.title || "",
  };
};

export function DomainHeader() {
  const location = useLocation();
  const { title, breadcrumb } = getDomainInfo(location.pathname);

  return (
    <header className="h-[var(--header-height)] border-b border-border bg-card flex items-center px-6 shrink-0">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      {breadcrumb && (
        <>
          <span className="mx-2 text-muted-foreground text-sm">/</span>
          <span className="text-sm text-muted-foreground">{breadcrumb}</span>
        </>
      )}
    </header>
  );
}
