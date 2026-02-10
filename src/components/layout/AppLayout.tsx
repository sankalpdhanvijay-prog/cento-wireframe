import { Outlet } from "react-router-dom";
import { PrimaryNav } from "./PrimaryNav";
import { DomainHeader } from "./DomainHeader";

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <PrimaryNav />
      <div className="flex flex-col flex-1 min-w-0">
        <DomainHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
