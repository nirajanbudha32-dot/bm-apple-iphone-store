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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserManager({ open, onOpenChange }: Props) {
  const { user: currentUser, refreshProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "salesman">("salesman");
  const [inviting, setInviting] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load users");
    } else {
      setUsers(data as Profile[]);
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
      });
    }

    toast.success(`Invited ${inviteEmail} as ${inviteRole}`);
    setInviteEmail("");
    setInvitePassword("");
    setInviteRole("salesman");
    setInviting(false);
    loadUsers();
  }

  async function toggleRole(userId: string, currentRole: "admin" | "salesman") {
    if (userId === currentUser?.id) {
      toast.error("Cannot change your own role");
      return;
    }
    const newRole = currentRole === "admin" ? "salesman" : "admin";
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success(`Role changed to ${newRole}`);
      loadUsers();
    }
  }

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
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "admin" | "salesman")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salesman">Salesman</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
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
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{u.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                    {u.id !== currentUser?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleRole(u.id, u.role)}
                        title={u.role === "admin" ? "Demote to salesman" : "Promote to admin"}
                      >
                        {u.role === "admin" ? (
                          <ShieldOff className="size-4" />
                        ) : (
                          <Shield className="size-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found.</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
