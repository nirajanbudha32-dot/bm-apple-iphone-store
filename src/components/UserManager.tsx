import { useEffect, useState } from "react";
import { UserPlus, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase, type Profile } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useStoreContext } from "@/lib/store-context";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Store = { id: string; name: string };

export function UserManager({ open, onOpenChange }: Props) {
  const { user: currentUser } = useAuth();
  const { isSuperAdmin, currentStoreId, stores } = useStoreContext();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("salesman");
  const [inviteStoreId, setInviteStoreId] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  const myRole = currentUser ? users.find((u) => u.id === currentUser.id)?.role : null;
  const canCreateStoreOwner = isSuperAdmin;
  const canCreateSalesman = isSuperAdmin || myRole === "store_owner";

  async function loadUsers() {
    setLoading(true);
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: true });
    if (!isSuperAdmin && currentStoreId) {
      query = query.eq("store_id", currentStoreId);
    }
    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load users");
    } else {
      setUsers((data as any[]).map((r) => ({
        id: r.id,
        email: r.email,
        role: r.role,
        storeId: r.store_id ?? null,
        created_at: r.created_at,
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open) loadUsers();
  }, [open]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !invitePassword.trim()) {
      toast.error("Email and password are required");
      return;
    }
    if (!inviteStoreId) {
      toast.error("Please select a store");
      return;
    }
    setInviting(true);

    const { data, error } = await supabase.auth.signUp({
      email: inviteEmail,
      password: invitePassword,
    });

    if (error) {
      toast.error(error.message);
      setInviting(false);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: inviteEmail,
        role: inviteRole,
        store_id: inviteStoreId,
      });
    }

    toast.success(`Invited ${inviteEmail} as ${inviteRole}`);
    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("salesman");
    setInviteStoreId("");
    setInviting(false);
    loadUsers();
  }

  async function toggleRole(userId: string, currentRole: string) {
    if (userId === currentUser?.id) {
      toast.error("Cannot change your own role");
      return;
    }
    let newRole: string;
    if (isSuperAdmin) {
      newRole = currentRole === "store_owner" ? "salesman" : "store_owner";
    } else {
      newRole = currentRole === "admin" ? "salesman" : "admin";
    }
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success(`Role changed to ${newRole}`);
      loadUsers();
    }
  }

  const availableRoles = isSuperAdmin
    ? [{ value: "store_owner", label: "Store Owner" }, { value: "salesman", label: "Salesman" }]
    : [{ value: "salesman", label: "Salesman" }];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Users</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleInvite} className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Invite new user</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="invite-password">Password</Label>
              <Input
                id="invite-password"
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Store</Label>
              <Select value={inviteStoreId} onValueChange={setInviteStoreId}>
                <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" size="sm" disabled={inviting}>
            <UserPlus className="mr-1 size-4" />
            {inviting ? "Inviting..." : "Invite user"}
          </Button>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">All users</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => {
                const storeName = stores.find((s) => s.id === u.storeId)?.name ?? "-";
                return (
                  <div key={u.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{u.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Store: {storeName} | Joined {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === "super_admin" ? "default" : u.role === "store_owner" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                      {u.id !== currentUser?.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleRole(u.id, u.role)}
                          title={`Change role`}
                        >
                          {u.role === "salesman" ? <Shield className="size-4" /> : <ShieldOff className="size-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
