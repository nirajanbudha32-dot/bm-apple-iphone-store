import { useEffect, useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useStoreContext, type Store } from "@/lib/store-context";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StoreManager({ open, onOpenChange }: Props) {
  const { isSuperAdmin } = useStoreContext();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPan, setNewPan] = useState("");
  const [newVat, setNewVat] = useState("");

  async function loadStores() {
    setLoading(true);
    const { data, error } = await supabase.from("stores").select("*").order("name");
    if (!error && data) {
      setStores(data.map((r: any) => ({
        id: r.id,
        name: r.name,
        address: r.address ?? "",
        phone: r.phone ?? "",
        email: r.email ?? "",
        pan: r.pan ?? "",
        vatNumber: r.vat_number ?? "",
        status: r.status,
        createdAt: r.created_at,
      })));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open) loadStores();
  }, [open]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Store name is required");
      return;
    }
    const { error } = await supabase.from("stores").insert({
      name: newName.trim(),
      address: newAddress.trim(),
      phone: newPhone.trim(),
      pan: newPan.trim(),
      vat_number: newVat.trim(),
      status: "active",
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Store created");
      setNewName("");
      setNewAddress("");
      setNewPhone("");
      setNewPan("");
      setNewVat("");
      setShowAdd(false);
      loadStores();
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase.from("stores").update({ status: newStatus }).eq("id", id);
    if (error) {
      toast.error("Failed to update store");
    } else {
      toast.success(`Store ${newStatus === "active" ? "activated" : "deactivated"}`);
      loadStores();
    }
  }

  if (!isSuperAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Stores</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-1 size-3.5" /> Add Store
          </Button>

          {showAdd && (
            <form onSubmit={handleAdd} className="space-y-2 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label>Store Name *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Store name" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone" />
                </div>
                <div>
                  <Label>PAN</Label>
                  <Input value={newPan} onChange={(e) => setNewPan(e.target.value)} placeholder="PAN number" />
                </div>
                <div>
                  <Label>VAT No</Label>
                  <Input value={newVat} onChange={(e) => setNewVat(e.target.value)} placeholder="VAT number" />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Address" />
                </div>
              </div>
              <Button type="submit" size="sm">Save Store</Button>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-2">
              {stores.map((s) => (
                <Card key={s.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{s.name}</span>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.address && `${s.address} | `}PAN: {s.pan || "-"} | VAT: {s.vatNumber || "-"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(s.id, s.status)}
                  >
                    {s.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </Card>
              ))}
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
