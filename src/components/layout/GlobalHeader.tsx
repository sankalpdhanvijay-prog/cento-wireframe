import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const outlets = [
  { id: "1", name: "Main Kitchen", brand: "Cento Foods" },
  { id: "2", name: "Downtown Outlet", brand: "Cento Foods" },
  { id: "3", name: "Airport Branch", brand: "Cento Foods" },
];

const currentUser = {
  fullName: "Arjun Mehta",
  role: "Operations Manager",
  username: "arjun.mehta",
  email: "arjun@centofoods.com",
  phone: "+91 98765 43210",
  initials: "AM",
};

export function GlobalHeader() {
  const [activeOutlet, setActiveOutlet] = useState(outlets[0]);
  const [outletOpen, setOutletOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close one when the other opens
  const handleOutletOpenChange = (open: boolean) => {
    setOutletOpen(open);
    if (open) setProfileOpen(false);
  };

  const handleProfileOpenChange = (open: boolean) => {
    setProfileOpen(open);
    if (open) setOutletOpen(false);
  };

  return (
    <header className="h-[var(--header-height)] border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-30">
      {/* Left: Outlet Selector */}
      <DropdownMenu open={outletOpen} onOpenChange={handleOutletOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-150",
              "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <span className="text-sm font-medium text-foreground leading-tight">
              {activeOutlet.brand}
              <span className="text-muted-foreground font-normal"> – </span>
              {activeOutlet.name}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-150",
                outletOpen && "rotate-180"
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="min-w-[240px] rounded-lg shadow-lg border border-border bg-popover p-1"
        >
          {outlets.map((outlet) => (
            <DropdownMenuItem
              key={outlet.id}
              onClick={() => setActiveOutlet(outlet)}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2.5 cursor-pointer text-sm",
                outlet.id === activeOutlet.id && "bg-cento-yellow-tint font-medium"
              )}
            >
              <span>
                {outlet.brand} – {outlet.name}
              </span>
              {outlet.id === activeOutlet.id && (
                <span className="h-1.5 w-1.5 rounded-full bg-cento-yellow shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Right: User Profile Avatar */}
      <Popover open={profileOpen} onOpenChange={handleProfileOpenChange}>
        <PopoverTrigger asChild>
          <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                {currentUser.initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-[300px] rounded-xl shadow-lg border border-border bg-popover p-0 z-50"
        >
          {/* User Info Top */}
          <div className="p-4 pb-3">
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-cento-yellow-tint-strong text-foreground text-sm font-semibold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[15px] font-semibold text-foreground leading-tight">
                  {currentUser.fullName}
                </p>
                <Badge
                  variant="secondary"
                  className="mt-1 text-[10px] font-medium px-2 py-0 h-5 rounded-full bg-cento-yellow-tint text-foreground border-0"
                >
                  {currentUser.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t border-border mx-4" />

          {/* User Details */}
          <div className="p-4 space-y-3">
            <ProfileField label="Username" value={currentUser.username} />
            <ProfileField label="Email" value={currentUser.email} />
            <ProfileField label="Phone" value={currentUser.phone} />
          </div>

          <div className="border-t border-border" />

          {/* Actions */}
          <div className="p-2">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors duration-150">
              <User className="h-4 w-4 text-muted-foreground" />
              My Profile
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/5 transition-colors duration-150">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
