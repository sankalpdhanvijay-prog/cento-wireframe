import { useState } from "react";
import { User, LogOut, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const currentUser = {
  fullName: "Arjun Mehta",
  role: "Operations Manager",
  username: "arjun.mehta",
  email: "arjun@centofoods.com",
  phone: "+91 98765 43210",
  initials: "AM",
};

const activeOutlet = "Main Kitchen";

export function GlobalHeader() {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="h-[var(--header-height)] border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-30">
      {/* Left: Brand Label */}
      <span className="text-sm font-semibold text-foreground tracking-tight">
        Cento Foods
      </span>

      {/* Right: Outlet Display + User Profile */}
      <div className="flex items-center gap-3">
        {/* Outlet (static, non-clickable) */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{activeOutlet}</span>
        </div>

        <div className="h-4 w-px bg-border" />

        {/* User Profile Avatar */}
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
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
      </div>
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
