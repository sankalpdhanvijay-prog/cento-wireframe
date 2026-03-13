import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Pencil, Power, Mail, Users, X, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { toast } from "@/hooks/use-toast";

type Role = "Brand Admin" | "Site Manager" | "Site User" | "Audit Manager";
type Status = "Active" | "Inactive";

interface UserRow {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: Role;
  outlets: string[];
  status: Status;
  createdOn: string;
  inviteSent: boolean;
}

const MOCK_OUTLETS = [
  { id: "o1", name: "Main Kitchen" },
  { id: "o2", name: "Branch - Indiranagar" },
  { id: "o3", name: "Branch - Koramangala" },
  { id: "o4", name: "Central Warehouse" },
];

const INITIAL_USERS: UserRow[] = [
  { id: "USR-001", fullName: "Arjun Mehta", username: "arjun.mehta", email: "arjun@centofoods.com", phone: "+91 98765 43210", role: "Brand Admin", outlets: ["o1","o2","o3","o4"], status: "Active", createdOn: "2025-10-01", inviteSent: true },
  { id: "USR-002", fullName: "Priya Sharma", username: "priya.sharma", email: "priya@centofoods.com", phone: "+91 91234 56789", role: "Site Manager", outlets: ["o1"], status: "Active", createdOn: "2025-11-03", inviteSent: true },
  { id: "USR-003", fullName: "Karan Nair", username: "karan.nair", email: "karan@centofoods.com", phone: "+91 99887 76655", role: "Site Manager", outlets: ["o2"], status: "Active", createdOn: "2025-11-10", inviteSent: true },
  { id: "USR-004", fullName: "Sneha Reddy", username: "sneha.reddy", email: "sneha@centofoods.com", phone: "+91 90011 22334", role: "Site User", outlets: ["o1"], status: "Active", createdOn: "2025-12-01", inviteSent: true },
  { id: "USR-005", fullName: "Rahul Verma", username: "rahul.verma", email: "rahul@centofoods.com", phone: "+91 93344 55667", role: "Site User", outlets: ["o3"], status: "Inactive", createdOn: "2025-12-15", inviteSent: true },
  { id: "USR-006", fullName: "Meena Iyer", username: "meena.iyer", email: "meena@centofoods.com", phone: "+91 95566 77889", role: "Audit Manager", outlets: ["o1","o2"], status: "Active", createdOn: "2026-01-05", inviteSent: true },
  { id: "USR-007", fullName: "Dev Kapoor", username: "dev.kapoor", email: "dev@centofoods.com", phone: "+91 98001 23456", role: "Site User", outlets: ["o4"], status: "Active", createdOn: "2026-01-20", inviteSent: false },
  { id: "USR-008", fullName: "Fatima Sheikh", username: "fatima.sheikh", email: "fatima@centofoods.com", phone: "+91 97712 34567", role: "Site Manager", outlets: ["o3"], status: "Active", createdOn: "2026-02-10", inviteSent: true },
];

const ROLE_COLORS: Record<Role, string> = {
  "Brand Admin": "bg-blue-50 text-blue-700 border-blue-200",
  "Site Manager": "bg-purple-50 text-purple-700 border-purple-200",
  "Site User": "bg-green-50 text-green-700 border-green-200",
  "Audit Manager": "bg-orange-50 text-orange-700 border-orange-200",
};

const ALL_ROLES: Role[] = ["Brand Admin", "Site Manager", "Site User", "Audit Manager"];

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function resolveOutlets(ids: string[], role: Role): string {
  if (role === "Brand Admin") return "All Outlets";
  const names = ids.map((id) => MOCK_OUTLETS.find((o) => o.id === id)?.name || id);
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function autoUsername(fullName: string) {
  return fullName.toLowerCase().replace(/[^a-z0-9\s.]/g, "").replace(/\s+/g, ".").trim();
}

// ── Outlet Assignment Component ──
function OutletAssignment({ role, selectedOutlets, onChangeOutlets }: { role: Role | ""; selectedOutlets: string[]; onChangeOutlets: (ids: string[]) => void }) {
  if (!role) return <div className="rounded-lg border border-border p-4 bg-muted/20"><p className="text-xs text-muted-foreground">Select a role to assign outlets.</p></div>;
  if (role === "Brand Admin") return (
    <div className="rounded-lg border border-border p-3 bg-muted/20 flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">Brand Admins have access to all outlets across the brand by default.</p>
    </div>
  );
  if (role === "Site Manager" || role === "Site User") return (
    <div>
      <Label className="text-xs">Outlet <span className="text-destructive">*</span></Label>
      <Select value={selectedOutlets[0] || ""} onValueChange={(v) => onChangeOutlets([v])}>
        <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select outlet" /></SelectTrigger>
        <SelectContent>{MOCK_OUTLETS.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">Scoped to one outlet only.</p>
    </div>
  );
  // Audit Manager — multi select
  return (
    <div>
      <Label className="text-xs">Outlets <span className="text-destructive">*</span> <span className="text-muted-foreground">(min 1)</span></Label>
      <div className="mt-1 border border-border rounded-lg p-2 space-y-1">
        {MOCK_OUTLETS.map((o) => (
          <label key={o.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/40 cursor-pointer">
            <Checkbox
              checked={selectedOutlets.includes(o.id)}
              onCheckedChange={(checked) => {
                if (checked) onChangeOutlets([...selectedOutlets, o.id]);
                else onChangeOutlets(selectedOutlets.filter((x) => x !== o.id));
              }}
              className="h-3.5 w-3.5"
            />
            <span className="text-sm">{o.name}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{selectedOutlets.length} outlet(s) selected</p>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>(INITIAL_USERS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [invName, setInvName] = useState("");
  const [invUsername, setInvUsername] = useState("");
  const [invUsernameTouched, setInvUsernameTouched] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invPhone, setInvPhone] = useState("");
  const [invRole, setInvRole] = useState<Role | "">("");
  const [invOutlets, setInvOutlets] = useState<string[]>([]);
  const [inviteConfirm, setInviteConfirm] = useState(false);

  // Edit form
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [edName, setEdName] = useState("");
  const [edUsername, setEdUsername] = useState("");
  const [edEmail, setEdEmail] = useState("");
  const [edPhone, setEdPhone] = useState("");
  const [edRole, setEdRole] = useState<Role | "">("");
  const [edOutlets, setEdOutlets] = useState<string[]>([]);
  const [editConfirm, setEditConfirm] = useState(false);
  const editRef = useRef<HTMLDivElement>(null);

  // Deactivate/Activate confirm
  const [statusConfirm, setStatusConfirm] = useState<{ user: UserRow; action: "Deactivate" | "Activate" } | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "All" && u.role !== roleFilter) return false;
      if (statusFilter !== "All" && u.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.fullName.toLowerCase().includes(q) && !u.username.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Invite helpers
  const resetInvite = () => {
    setShowInvite(false); setInvName(""); setInvUsername(""); setInvUsernameTouched(false);
    setInvEmail(""); setInvPhone(""); setInvRole(""); setInvOutlets([]);
  };

  const handleInvNameBlur = () => {
    if (!invUsernameTouched && invName) setInvUsername(autoUsername(invName));
  };

  const canInvite = invName.trim() && invUsername.trim() && invEmail.trim() && invPhone.trim() && invRole &&
    (invRole === "Brand Admin" || invOutlets.length > 0);

  const sendInvite = () => {
    const newUser: UserRow = {
      id: `USR-${String(users.length + 1).padStart(3, "0")}`,
      fullName: invName, username: invUsername, email: invEmail, phone: invPhone,
      role: invRole as Role,
      outlets: invRole === "Brand Admin" ? MOCK_OUTLETS.map((o) => o.id) : invOutlets,
      status: "Active", createdOn: "2026-03-13", inviteSent: true,
    };
    setUsers([newUser, ...users]);
    toast({ title: "Invite Sent", description: `Invite sent to ${invEmail}` });
    resetInvite();
    setInviteConfirm(false);
  };

  // Edit helpers
  const openEdit = (u: UserRow) => {
    setEditUser(u); setEdName(u.fullName); setEdUsername(u.username); setEdEmail(u.email);
    setEdPhone(u.phone); setEdRole(u.role); setEdOutlets([...u.outlets]);
    setTimeout(() => editRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const closeEdit = () => setEditUser(null);

  const hasEditChanges = editUser && (
    edName !== editUser.fullName || edUsername !== editUser.username || edEmail !== editUser.email ||
    edPhone !== editUser.phone || edRole !== editUser.role || JSON.stringify(edOutlets.sort()) !== JSON.stringify([...editUser.outlets].sort())
  );

  const saveEdit = () => {
    if (!editUser) return;
    setUsers(users.map((u) => u.id === editUser.id ? {
      ...u, fullName: edName, username: edUsername, email: edEmail, phone: edPhone,
      role: edRole as Role,
      outlets: edRole === "Brand Admin" ? MOCK_OUTLETS.map((o) => o.id) : edOutlets,
    } : u));
    toast({ title: "Changes Saved", description: "User details updated." });
    closeEdit();
    setEditConfirm(false);
  };

  const toggleStatus = (user: UserRow) => {
    const newStatus: Status = user.status === "Active" ? "Inactive" : "Active";
    setUsers(users.map((u) => u.id === user.id ? { ...u, status: newStatus } : u));
    toast({ title: newStatus === "Active" ? "User Activated" : "User Deactivated", description: `${user.fullName} has been ${newStatus === "Active" ? "activated" : "deactivated"}.` });
    setStatusConfirm(null);
  };

  const resendInvite = (user: UserRow) => {
    setUsers(users.map((u) => u.id === user.id ? { ...u, inviteSent: true } : u));
    toast({ title: "Invite Sent", description: `Invite sent to ${user.email}` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="cento-page-title">User Management</h2>
        <p className="text-xs text-muted-foreground mt-1">Manage team members and their outlet access</p>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search name, username, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs" />
        </div>
        <Button variant="cento" size="sm" className="gap-1.5 text-xs" onClick={() => setShowInvite(true)}>
          <Plus className="h-3.5 w-3.5" /> Invite User
        </Button>
      </div>

      {/* Invite User Form */}
      {showInvite && (
        <div className="cento-card relative">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-foreground">Invite New User</h3>
            <button onClick={resetInvite} className="p-1 rounded hover:bg-muted/60"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="space-y-5">
            {/* Identity */}
            <div>
              <h4 className="cento-section-header mb-3">Identity</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Full Name <span className="text-destructive">*</span></Label>
                  <Input value={invName} onChange={(e) => setInvName(e.target.value)} onBlur={handleInvNameBlur} className="mt-1 h-9 text-sm" placeholder="Full name" />
                </div>
                <div>
                  <Label className="text-xs">Username <span className="text-destructive">*</span></Label>
                  <Input value={invUsername} onChange={(e) => { setInvUsername(e.target.value); setInvUsernameTouched(true); }} className="mt-1 h-9 text-sm" placeholder="username" />
                  <p className="text-xs text-muted-foreground mt-1">Used to log in.</p>
                </div>
                <div>
                  <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} className="mt-1 h-9 text-sm" placeholder="email@company.com" />
                </div>
                <div>
                  <Label className="text-xs">Phone <span className="text-destructive">*</span></Label>
                  <Input value={invPhone} onChange={(e) => setInvPhone(e.target.value)} className="mt-1 h-9 text-sm" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
            </div>

            {/* Role */}
            <div>
              <h4 className="cento-section-header mb-3">Role</h4>
              <div className="max-w-xs">
                <Label className="text-xs">Role <span className="text-destructive">*</span></Label>
                <Select value={invRole} onValueChange={(v) => { setInvRole(v as Role); setInvOutlets([]); }}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Outlet Assignment */}
            <div>
              <h4 className="cento-section-header mb-3">Outlet Assignment</h4>
              <div className="max-w-xs">
                <OutletAssignment role={invRole} selectedOutlets={invOutlets} onChangeOutlets={setInvOutlets} />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={resetInvite}>Cancel</Button>
              <Button variant="cento" size="sm" disabled={!canInvite} onClick={() => setInviteConfirm(true)}>Send Invite</Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Roles</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      {filtered.length === 0 ? (
        <div className="cento-empty-state py-16">
          <Users className="h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">No users found</p>
          <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Outlets</TableHead>
                <TableHead className="text-xs">Contact</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Joined</TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-cento-yellow-tint flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-foreground">{getInitials(u.fullName)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-medium", ROLE_COLORS[u.role])}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.role === "Brand Admin" ? (
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">All Outlets</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{resolveOutlets(u.outlets, u.role)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.phone}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-2 w-2 rounded-full", u.status === "Active" ? "bg-green-500" : "bg-muted-foreground/40")} />
                      <span className={cn("text-xs", u.status === "Active" ? "text-green-700" : "text-muted-foreground")}>{u.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(u.createdOn)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-muted/60 transition-colors"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /></button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">Edit</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setStatusConfirm({ user: u, action: u.status === "Active" ? "Deactivate" : "Activate" })}
                            className="p-1.5 rounded hover:bg-muted/60 transition-colors"
                          >
                            <Power className={cn("h-3.5 w-3.5", u.status === "Active" ? "text-muted-foreground" : "text-green-600")} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{u.status === "Active" ? "Deactivate" : "Activate"}</p></TooltipContent>
                      </Tooltip>
                      {!u.inviteSent && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => resendInvite(u)} className="p-1.5 rounded hover:bg-muted/60 transition-colors"><Mail className="h-3.5 w-3.5 text-muted-foreground" /></button>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">Resend Invite</p></TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit User Form */}
      {editUser && (
        <div ref={editRef} className="cento-card relative">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Edit User</h3>
              <span className="text-xs text-muted-foreground">{editUser.fullName}</span>
            </div>
            <button onClick={closeEdit} className="p-1 rounded hover:bg-muted/60"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="flex gap-8">
            {/* Left: Summary */}
            <div className="w-72 shrink-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-cento-yellow-tint flex items-center justify-center">
                  <span className="text-base font-semibold text-foreground">{getInitials(editUser.fullName)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{editUser.fullName}</p>
                  <Badge variant="outline" className={cn("text-xs font-medium mt-0.5", ROLE_COLORS[editUser.role])}>{editUser.role}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={cn("h-2 w-2 rounded-full", editUser.status === "Active" ? "bg-green-500" : "bg-muted-foreground/40")} />
                <span className={cn("text-xs", editUser.status === "Active" ? "text-green-700" : "text-muted-foreground")}>{editUser.status}</span>
              </div>
              <Separator />
              <div className="space-y-3 text-xs">
                <div><span className="text-muted-foreground">Username</span><p className="font-medium mt-0.5">@{editUser.username}</p></div>
                <div><span className="text-muted-foreground">Email</span><p className="font-medium mt-0.5">{editUser.email}</p></div>
                <div><span className="text-muted-foreground">Phone</span><p className="font-medium mt-0.5">{editUser.phone}</p></div>
                <div><span className="text-muted-foreground">Joined</span><p className="font-medium mt-0.5">{formatDate(editUser.createdOn)}</p></div>
                <div><span className="text-muted-foreground">Outlets</span><p className="font-medium mt-0.5">{resolveOutlets(editUser.outlets, editUser.role)}</p></div>
              </div>
            </div>

            {/* Right: Editable form */}
            <div className="flex-1 space-y-5">
              <div>
                <h4 className="cento-section-header mb-3">Identity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs">Full Name</Label><Input value={edName} onChange={(e) => setEdName(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Username</Label><Input value={edUsername} onChange={(e) => setEdUsername(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Email</Label><Input type="email" value={edEmail} onChange={(e) => setEdEmail(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={edPhone} onChange={(e) => setEdPhone(e.target.value)} className="mt-1 h-9 text-sm" /></div>
                </div>
              </div>
              <div>
                <h4 className="cento-section-header mb-3">Role</h4>
                <div className="max-w-xs">
                  <Select value={edRole} onValueChange={(v) => { setEdRole(v as Role); setEdOutlets([]); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <h4 className="cento-section-header mb-3">Outlet Assignment</h4>
                <div className="max-w-xs">
                  <OutletAssignment role={edRole} selectedOutlets={edOutlets} onChangeOutlets={setEdOutlets} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" className={editUser.status === "Active" ? "text-destructive border-destructive/30 hover:bg-destructive/5" : "text-green-700 border-green-200 hover:bg-green-50"} onClick={() => setStatusConfirm({ user: editUser, action: editUser.status === "Active" ? "Deactivate" : "Activate" })}>
                  {editUser.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={closeEdit}>Cancel</Button>
                  <Button variant="cento" size="sm" disabled={!hasEditChanges} onClick={() => setEditConfirm(true)}>Save Changes</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        open={inviteConfirm}
        onOpenChange={setInviteConfirm}
        title="Send Invite"
        description={`An invite link will be sent to ${invEmail}. They will set their own password on first login.`}
        confirmLabel="Send Invite"
        onConfirm={sendInvite}
      />

      <ConfirmationModal
        open={editConfirm}
        onOpenChange={setEditConfirm}
        title="Save Changes"
        description="Updates will take effect immediately."
        confirmLabel="Save"
        onConfirm={saveEdit}
      />

      {statusConfirm && (
        <ConfirmationModal
          open={!!statusConfirm}
          onOpenChange={() => setStatusConfirm(null)}
          title={`${statusConfirm.action} User`}
          description={statusConfirm.action === "Deactivate"
            ? "This user will lose access immediately. You can reactivate them at any time."
            : "This user will regain access to their assigned outlets."}
          confirmLabel={statusConfirm.action}
          confirmVariant={statusConfirm.action === "Deactivate" ? "destructive" : "default"}
          onConfirm={() => toggleStatus(statusConfirm.user)}
        />
      )}
    </div>
  );
}
